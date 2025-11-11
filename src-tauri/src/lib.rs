use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use sysinfo::{ProcessRefreshKind, System, ProcessesToUpdate};
use tauri::{State, Manager, Emitter, menu::{Menu, MenuItem}};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo {
    pub name: String,
    pub path: String,
    pub pid: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebhookMessage {
    pub content: String,
}

// State to track blocked apps
pub struct BlockedApps(Arc<Mutex<HashMap<String, bool>>>);

// State to track webhook rate limiting (webhook_url -> last_send_timestamp)
pub struct WebhookRateLimiter(Arc<Mutex<HashMap<String, std::time::Instant>>>);

// Process cache to avoid redundant scans
pub struct ProcessCache {
    cache: Arc<Mutex<Option<(Vec<AppInfo>, std::time::Instant)>>>,
    ttl: std::time::Duration,
}

impl ProcessCache {
    fn new(ttl_seconds: u64) -> Self {
        Self {
            cache: Arc::new(Mutex::new(None)),
            ttl: std::time::Duration::from_secs(ttl_seconds),
        }
    }
    
    fn get_or_refresh(&self) -> Result<Vec<AppInfo>, String> {
        use std::time::Instant;
        
        let mut cache = self.cache.lock().unwrap();
        let now = Instant::now();
        
        // Check if cache is valid
        if let Some((cached_processes, cached_time)) = cache.as_ref() {
            if now.duration_since(*cached_time) < self.ttl {
                return Ok(cached_processes.clone());
            }
        }
        
        // Cache expired or doesn't exist, refresh
        let processes = fetch_running_processes()?;
        *cache = Some((processes.clone(), now));
        Ok(processes)
    }
}

// Extract the actual process fetching logic
fn fetch_running_processes() -> Result<Vec<AppInfo>, String> {
    let mut sys = System::new_all();
    sys.refresh_processes_specifics(
        ProcessesToUpdate::All,
        true,
        ProcessRefreshKind::everything(),
    );
    
    let mut apps: Vec<AppInfo> = sys
        .processes()
        .iter()
        .filter_map(|(pid, process)| {
            let path = process
                .exe()
                .unwrap_or_else(|| std::path::Path::new(""))
                .to_string_lossy()
                .to_string();
            
            // Only include processes with valid executable paths
            if path.is_empty() {
                return None;
            }
            
            Some(AppInfo {
                name: process.name().to_string_lossy().to_string(),
                path,
                pid: Some(pid.as_u32()),
            })
        })
        .collect();
    
    // Sort by path (more reliable than name)
    apps.sort_by(|a, b| a.path.to_lowercase().cmp(&b.path.to_lowercase()));
    
    // Deduplicate by path (not name, since same path = same executable)
    apps.dedup_by(|a, b| a.path.to_lowercase() == b.path.to_lowercase());
    
    Ok(apps)
}

#[tauri::command]
async fn get_running_processes(cache: State<'_, ProcessCache>) -> Result<Vec<AppInfo>, String> {
    cache.get_or_refresh()
}

// Helper function to scan a directory for executables (non-recursive for performance)
fn scan_directory_for_exes(dir: &str, max_depth: usize) -> Vec<AppInfo> {
    use std::fs;
    use std::path::Path;
    
    let mut apps = Vec::new();
    
    fn scan_recursive(path: &Path, current_depth: usize, max_depth: usize, apps: &mut Vec<AppInfo>) {
        if current_depth > max_depth {
            return;
        }
        
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                if let Ok(metadata) = entry.metadata() {
                    let entry_path = entry.path();
                    
                    if metadata.is_file() {
                        if let Some(extension) = entry_path.extension() {
                            if extension.eq_ignore_ascii_case("exe") {
                                let path_str = entry_path.to_string_lossy().to_string();
                                let path_lower = path_str.to_lowercase();
                                
                                // Skip uninstallers and other utility executables
                                if !path_lower.contains("uninstall") 
                                    && !path_lower.contains("uninst")
                                    && !path_lower.contains("unins000")
                                    && !path_lower.contains("setup")
                                    && !path_lower.contains("installer") {
                                    
                                    // Extract name from filename
                                    let name = entry_path
                                        .file_stem()
                                        .unwrap_or_default()
                                        .to_string_lossy()
                                        .to_string();
                                    
                                    apps.push(AppInfo {
                                        name,
                                        path: path_str,
                                        pid: None,
                                    });
                                }
                            }
                        }
                    } else if metadata.is_dir() && current_depth < max_depth {
                        // Continue scanning subdirectories
                        scan_recursive(&entry_path, current_depth + 1, max_depth, apps);
                    }
                }
            }
        }
    }
    
    scan_recursive(Path::new(dir), 0, max_depth, &mut apps);
    apps
}

// Helper function to find Steam library folders
fn get_steam_library_paths() -> Vec<String> {
    use std::fs;
    use std::path::Path;
    
    let mut paths = Vec::new();
    
    // Default Steam installation path
    let default_steam_path = "C:\\Program Files (x86)\\Steam\\steamapps\\common";
    if Path::new(default_steam_path).exists() {
        paths.push(default_steam_path.to_string());
    }
    
    // Try to read libraryfolders.vdf to find additional Steam library locations
    let library_folders_path = "C:\\Program Files (x86)\\Steam\\steamapps\\libraryfolders.vdf";
    if let Ok(content) = fs::read_to_string(library_folders_path) {
        // Parse the VDF file to find library paths
        for line in content.lines() {
            if line.contains("\"path\"") {
                // Extract path from line like: "path"		"C:\\SteamLibrary"
                if let Some(start) = line.rfind('"') {
                    if let Some(end) = line[..start].rfind('"') {
                        let path = &line[end + 1..start];
                        // Unescape the path (replace \\ with \)
                        let unescaped = path.replace("\\\\", "\\");
                        let steamapps_common = format!("{}\\steamapps\\common", unescaped);
                        if Path::new(&steamapps_common).exists() {
                            paths.push(steamapps_common);
                        }
                    }
                }
            }
        }
    }
    
    paths
}

#[tauri::command]
async fn get_installed_apps() -> Result<Vec<AppInfo>, String> {
    let mut apps = Vec::new();
    
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::System::Registry::{
            RegOpenKeyExW, RegEnumKeyExW, RegQueryValueExW, RegCloseKey,
            HKEY_LOCAL_MACHINE, HKEY_CURRENT_USER, KEY_READ
        };
        use windows::core::PCWSTR;
        use std::env;
        
        // 1. Scan common installation directories for executables
        let mut scan_dirs = vec![
            ("C:\\Program Files", 2),           // Scan 2 levels deep
            ("C:\\Program Files (x86)", 2),     // Scan 2 levels deep
        ];
        
        // Add user-specific directories
        if let Ok(userprofile) = env::var("USERPROFILE") {
            scan_dirs.push((format!("{}\\AppData\\Local\\Programs", userprofile).leak(), 2));
        }
        if let Ok(localappdata) = env::var("LOCALAPPDATA") {
            scan_dirs.push((format!("{}\\Programs", localappdata).leak(), 2));
        }
        
        for (dir, depth) in scan_dirs {
            if std::path::Path::new(dir).exists() {
                apps.extend(scan_directory_for_exes(dir, depth));
            }
        }
        
        // 2. Scan Steam library folders
        for steam_path in get_steam_library_paths() {
            apps.extend(scan_directory_for_exes(&steam_path, 1)); // Only scan game folders, not deep
        }
        
        // Helper function to query registry value
        let query_reg_string = |hkey, key_name: &str| -> Option<String> {
            unsafe {
                let key_wide: Vec<u16> = key_name.encode_utf16().chain(Some(0)).collect();
                let mut buffer = vec![0u16; 512];
                let mut buffer_size = (buffer.len() * 2) as u32;
                
                if RegQueryValueExW(
                    hkey,
                    PCWSTR::from_raw(key_wide.as_ptr()),
                    None,
                    None,
                    Some(buffer.as_mut_ptr() as *mut u8),
                    Some(&mut buffer_size),
                ).is_ok() && buffer_size > 0 {
                    let value = String::from_utf16_lossy(&buffer[..((buffer_size / 2) as usize).saturating_sub(1)]);
                    if !value.trim().is_empty() {
                        return Some(value.trim().to_string());
                    }
                }
            }
            None
        };
        
        // 3. Check Windows Registry for installed applications
        unsafe {
            let registry_roots = vec![
                (HKEY_LOCAL_MACHINE, vec![
                    "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
                    "SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
                ]),
                (HKEY_CURRENT_USER, vec![
                    "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
                ]),
            ];
            
            for (root_key, uninstall_paths) in registry_roots {
                for path in uninstall_paths {
                    let path_wide: Vec<u16> = path.encode_utf16().chain(Some(0)).collect();
                    let mut hkey = Default::default();
                    
                    if RegOpenKeyExW(
                        root_key,
                        PCWSTR::from_raw(path_wide.as_ptr()),
                        0,
                        KEY_READ,
                        &mut hkey,
                    ).is_ok() {
                        let mut index = 0;
                        loop {
                            let mut name_buffer = vec![0u16; 256];
                            let mut name_len = name_buffer.len() as u32;
                            
                            if RegEnumKeyExW(
                                hkey,
                                index,
                                windows::core::PWSTR::from_raw(name_buffer.as_mut_ptr()),
                                &mut name_len,
                                None,
                                windows::core::PWSTR::null(),
                                None,
                                None,
                            ).is_err() {
                                break;
                            }
                            
                            let subkey_name = String::from_utf16_lossy(&name_buffer[..name_len as usize]);
                            let subkey_path = format!("{}\\{}", path, subkey_name);
                            let subkey_wide: Vec<u16> = subkey_path.encode_utf16().chain(Some(0)).collect();
                            
                            let mut subkey = Default::default();
                            if RegOpenKeyExW(
                                root_key,
                                PCWSTR::from_raw(subkey_wide.as_ptr()),
                                0,
                                KEY_READ,
                                &mut subkey,
                            ).is_ok() {
                                // Get DisplayName
                                if let Some(display_name) = query_reg_string(subkey, "DisplayName") {
                                    // Try multiple methods to find the executable
                                    let mut exe_path = String::new();
                                    
                                    // Method 1: DisplayIcon (often points to the .exe)
                                    if let Some(icon_path) = query_reg_string(subkey, "DisplayIcon") {
                                        // DisplayIcon often has ",0" at the end for icon index, remove it
                                        let clean_path = icon_path.split(',').next().unwrap_or("").trim();
                                        // Remove quotes if present
                                        let clean_path = clean_path.trim_matches('"');
                                        if clean_path.to_lowercase().ends_with(".exe") {
                                            exe_path = clean_path.to_string();
                                        }
                                    }
                                    
                                    // Method 2: InstallLocation + scan for .exe files
                                    if exe_path.is_empty() {
                                        if let Some(install_loc) = query_reg_string(subkey, "InstallLocation") {
                                            let install_path = std::path::Path::new(&install_loc);
                                            if install_path.exists() {
                                                // Look for .exe files in the installation directory
                                                if let Ok(entries) = std::fs::read_dir(install_path) {
                                                    for entry in entries.flatten() {
                                                        if let Ok(metadata) = entry.metadata() {
                                                            if metadata.is_file() {
                                                                if let Some(ext) = entry.path().extension() {
                                                                    if ext.eq_ignore_ascii_case("exe") {
                                                                        let path_str = entry.path().to_string_lossy().to_string();
                                                                        let path_lower = path_str.to_lowercase();
                                                                        // Skip uninstallers
                                                                        if !path_lower.contains("uninstall") 
                                                                            && !path_lower.contains("uninst") {
                                                                            exe_path = path_str;
                                                                            break;
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    
                                    // Only add if we have a valid .exe path and it's not an uninstaller
                                    let exe_path_lower = exe_path.to_lowercase();
                                    if !exe_path.is_empty() 
                                        && exe_path_lower.ends_with(".exe")
                                        && !exe_path_lower.contains("uninstall")
                                        && !exe_path_lower.contains("uninst")
                                        && std::path::Path::new(&exe_path).exists() {
                                        apps.push(AppInfo {
                                            name: display_name,
                                            path: exe_path,
                                            pid: None,
                                        });
                                    }
                                }
                                
                                let _ = RegCloseKey(subkey);
                            }
                            
                            index += 1;
                        }
                        
                        let _ = RegCloseKey(hkey);
                    }
                }
            }
        }
    }
    
    // Sort and deduplicate by executable path (not name)
    // This prevents duplicate entries for the same application
    apps.sort_by(|a, b| a.path.to_lowercase().cmp(&b.path.to_lowercase()));
    apps.dedup_by(|a, b| a.path.to_lowercase() == b.path.to_lowercase());
    
    Ok(apps)
}

#[tauri::command]
async fn browse_for_executable(app: tauri::AppHandle) -> Result<Option<AppInfo>, String> {
    use tauri_plugin_dialog::DialogExt;
    use std::sync::{Arc, Mutex};
    use std::path::PathBuf;
    
    let result: Arc<Mutex<Option<PathBuf>>> = Arc::new(Mutex::new(None));
    let result_clone = Arc::clone(&result);
    
    app.dialog()
        .file()
        .add_filter("Executable Files", &["exe"])
        .set_title("Select an application to block")
        .pick_file(move |file_path| {
            let mut res = result_clone.lock().unwrap();
            // Convert FilePath to PathBuf
            *res = file_path.and_then(|fp| fp.as_path().map(|p| p.to_path_buf()));
        });
    
    // Small delay to allow dialog to complete
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    let file_path = result.lock().unwrap().clone();
    
    if let Some(path) = file_path {
        let path_str = path.to_string_lossy().to_string();
        let name = path
            .file_stem()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        
        Ok(Some(AppInfo {
            name,
            path: path_str,
            pid: None,
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
async fn kill_process(pid: u32) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::System::Threading::{
            OpenProcess, TerminateProcess, PROCESS_TERMINATE,
        };
        
        unsafe {
            let handle = OpenProcess(PROCESS_TERMINATE, false, pid);
            if let Ok(handle) = handle {
                if handle.is_invalid() {
                    return Err("Failed to open process".to_string());
                }
                
                let result = TerminateProcess(handle, 1);
                let _ = windows::Win32::Foundation::CloseHandle(handle);
                
                if result.is_ok() {
                    return Ok(true);
                }
            }
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        use std::process::Command;
        let output = Command::new("kill")
            .arg("-9")
            .arg(pid.to_string())
            .output();
        
        if let Ok(output) = output {
            return Ok(output.status.success());
        }
    }
    
    Err("Failed to kill process".to_string())
}

#[tauri::command]
async fn block_application(
    app_name: String,
    blocked_apps: State<'_, BlockedApps>,
) -> Result<bool, String> {
    let mut apps = blocked_apps.0.lock().unwrap();
    apps.insert(app_name.to_lowercase(), true);
    Ok(true)
}

#[tauri::command]
async fn unblock_application(
    app_name: String,
    blocked_apps: State<'_, BlockedApps>,
) -> Result<bool, String> {
    let mut apps = blocked_apps.0.lock().unwrap();
    apps.remove(&app_name.to_lowercase());
    Ok(true)
}

#[tauri::command]
async fn is_app_blocked(
    app_name: String,
    blocked_apps: State<'_, BlockedApps>,
) -> Result<bool, String> {
    let apps = blocked_apps.0.lock().unwrap();
    Ok(apps.contains_key(&app_name.to_lowercase()))
}

#[tauri::command]
async fn get_blocked_apps(blocked_apps: State<'_, BlockedApps>) -> Result<Vec<String>, String> {
    let apps = blocked_apps.0.lock().unwrap();
    Ok(apps.keys().cloned().collect())
}

#[tauri::command]
async fn send_discord_webhook(
    webhook_url: String,
    message: String,
    rate_limiter: State<'_, WebhookRateLimiter>,
) -> Result<bool, String> {
    use std::time::{Duration, Instant};
    
    const MIN_INTERVAL: Duration = Duration::from_secs(5); // 5 seconds between webhooks
    
    // Check rate limit
    {
        let mut limiter = rate_limiter.0.lock().unwrap();
        let now = Instant::now();
        
        if let Some(last_send) = limiter.get(&webhook_url) {
            let elapsed = now.duration_since(*last_send);
            if elapsed < MIN_INTERVAL {
                let remaining = MIN_INTERVAL - elapsed;
                return Err(format!(
                    "Rate limit: Please wait {} seconds before sending another webhook",
                    remaining.as_secs()
                ));
            }
        }
        
        // Update last send time
        limiter.insert(webhook_url.clone(), now);
    }
    
    let client = reqwest::Client::new();
    let webhook_message = WebhookMessage { content: message };
    
    let response = client
        .post(&webhook_url)
        .json(&webhook_message)
        .send()
        .await;
    
    match response {
        Ok(res) => {
            if res.status().is_success() {
                Ok(true)
            } else {
                Err(format!("Webhook failed with status: {}", res.status()))
            }
        }
        Err(e) => Err(format!("Failed to send webhook: {}", e)),
    }
}

#[tauri::command]
async fn get_browser_processes() -> Result<Vec<AppInfo>, String> {
    let browser_names = vec![
        "chrome.exe",
        "firefox.exe",
        "msedge.exe",
        "opera.exe",
        "brave.exe",
        "vivaldi.exe",
        "safari",
        "chromium",
        "iexplore.exe",      // Internet Explorer
        "microsoftedge.exe", // Old Edge
        "waterfox.exe",      // Waterfox
        "palemoon.exe",      // Pale Moon
        "arc.exe",           // Arc Browser
        "torch.exe",         // Torch Browser
        "yandex.exe",        // Yandex Browser
    ];
    
    let mut sys = System::new_all();
    sys.refresh_processes_specifics(
        ProcessesToUpdate::All,
        true,
        ProcessRefreshKind::everything(),
    );
    
    let browsers: Vec<AppInfo> = sys
        .processes()
        .iter()
        .filter(|(_, process)| {
            let name = process.name().to_string_lossy().to_lowercase();
            browser_names.iter().any(|b| name.contains(b))
        })
        .map(|(pid, process)| AppInfo {
            name: process.name().to_string_lossy().to_string(),
            path: process
                .exe()
                .unwrap_or_else(|| std::path::Path::new(""))
                .to_string_lossy()
                .to_string(),
            pid: Some(pid.as_u32()),
        })
        .collect();
    
    Ok(browsers)
}

#[tauri::command]
fn verify_pin(stored_hash: String, input_pin: String) -> Result<bool, String> {
    use argon2::{Argon2, PasswordHash, PasswordVerifier};
    
    // Check if this is an old MD5 hash (32 hex characters)
    if stored_hash.len() == 32 && stored_hash.chars().all(|c| c.is_ascii_hexdigit()) {
        // Legacy MD5 verification for backward compatibility
        let input_hash = format!("{:x}", md5::compute(input_pin.as_bytes()));
        return Ok(input_hash == stored_hash);
    }
    
    // New Argon2 verification
    let parsed_hash = PasswordHash::new(&stored_hash)
        .map_err(|e| format!("Invalid password hash: {}", e))?;
    
    Ok(Argon2::default()
        .verify_password(input_pin.as_bytes(), &parsed_hash)
        .is_ok())
}

#[tauri::command]
fn hash_pin(pin: String) -> Result<String, String> {
    use argon2::{
        password_hash::{PasswordHasher, SaltString},
        Argon2,
    };
    use rand_core::OsRng;
    
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    
    let password_hash = argon2
        .hash_password(pin.as_bytes(), &salt)
        .map_err(|e| format!("Failed to hash password: {}", e))?;
    
    Ok(password_hash.to_string())
}

// Website blocking via hosts file modification
#[cfg(target_os = "windows")]
const HOSTS_FILE_PATH: &str = "C:\\Windows\\System32\\drivers\\etc\\hosts";

#[cfg(not(target_os = "windows"))]
const HOSTS_FILE_PATH: &str = "/etc/hosts";

const NEU_MARKER_START: &str = "# NEU_BLOCK_START - Do not edit this section manually";
const NEU_MARKER_END: &str = "# NEU_BLOCK_END";

#[tauri::command]
async fn apply_website_blocks(domains: Vec<String>) -> Result<(), String> {
    use std::fs::{self, OpenOptions};
    use std::io::{Read, Write};

    // Read existing hosts file
    let mut hosts_content = String::new();
    if let Ok(mut file) = fs::File::open(HOSTS_FILE_PATH) {
        file.read_to_string(&mut hosts_content)
            .map_err(|e| format!("Failed to read hosts file: {}", e))?;
    }

    // Remove existing NEU block if present
    let mut new_content = String::new();
    let mut skip_neu_block = false;
    
    for line in hosts_content.lines() {
        if line.contains(NEU_MARKER_START) {
            skip_neu_block = true;
            continue;
        }
        if line.contains(NEU_MARKER_END) {
            skip_neu_block = false;
            continue;
        }
        if !skip_neu_block {
            new_content.push_str(line);
            new_content.push('\n');
        }
    }

    // Add NEU block with new domains if any domains provided
    if !domains.is_empty() {
        new_content.push_str("\n");
        new_content.push_str(NEU_MARKER_START);
        new_content.push('\n');
        
        for domain in domains {
            let domain = domain.trim();
            if !domain.is_empty() {
                new_content.push_str(&format!("127.0.0.1 {}\n", domain));
                new_content.push_str(&format!("127.0.0.1 www.{}\n", domain));
            }
        }
        
        new_content.push_str(NEU_MARKER_END);
        new_content.push('\n');
    }

    // Write back to hosts file (requires admin privileges)
    let mut file = OpenOptions::new()
        .write(true)
        .truncate(true)
        .open(HOSTS_FILE_PATH)
        .map_err(|e| format!("Failed to open hosts file for writing (requires admin): {}", e))?;

    file.write_all(new_content.as_bytes())
        .map_err(|e| format!("Failed to write to hosts file: {}", e))?;

    // Flush DNS cache on Windows
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let _ = Command::new("ipconfig")
            .args(["/flushdns"])
            .output();
    }

    Ok(())
}

#[tauri::command]
async fn remove_website_blocks() -> Result<(), String> {
    apply_website_blocks(vec![]).await
}

#[tauri::command]
async fn get_blocked_domains() -> Result<Vec<String>, String> {
    use std::fs;
    use std::io::Read;

    let mut hosts_content = String::new();
    if let Ok(mut file) = fs::File::open(HOSTS_FILE_PATH) {
        file.read_to_string(&mut hosts_content)
            .map_err(|e| format!("Failed to read hosts file: {}", e))?;
    }

    let mut domains = Vec::new();
    let mut in_neu_block = false;

    for line in hosts_content.lines() {
        if line.contains(NEU_MARKER_START) {
            in_neu_block = true;
            continue;
        }
        if line.contains(NEU_MARKER_END) {
            in_neu_block = false;
            continue;
        }
        if in_neu_block && line.trim().starts_with("127.0.0.1") {
            if let Some(domain) = line.split_whitespace().nth(1) {
                // Skip www. variants to avoid duplicates
                if !domain.starts_with("www.") {
                    domains.push(domain.to_string());
                }
            }
        }
    }

    Ok(domains)
}

#[tauri::command]
async fn notify_app_closing(webhook_url: Option<String>) -> Result<(), String> {
    if let Some(url) = webhook_url {
        if !url.is_empty() {
            let client = reqwest::Client::new();
            let webhook_message = WebhookMessage {
                content: "⚠️ **Accountability App Closing**\n\nThe accountability app is being closed. This may affect monitoring.".to_string(),
            };

            let _ = client.post(&url).json(&webhook_message).send().await;
        }
    }
    Ok(())
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(BlockedApps(Arc::new(Mutex::new(HashMap::new()))))
        .manage(WebhookRateLimiter(Arc::new(Mutex::new(HashMap::new()))))
        .manage(ProcessCache::new(2)) // 2-second TTL for process cache
        .setup(|app| {
            // Create system tray
            let quit = MenuItem::with_id(app, "quit", "Quit NEU", true, None::<&str>)?;
            let show = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .icon(app.default_window_icon().unwrap().clone())
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "quit" => {
                            // Emit event to frontend to send webhook
                            if let Some(window) = app.get_webview_window("main") {
                                // Emit the app-quitting event that App.tsx is listening for
                                let _ = window.emit("app-quitting", ());
                                
                                // Give the frontend time to send the webhook (2 seconds)
                                let app_clone = app.clone();
                                std::thread::spawn(move || {
                                    std::thread::sleep(std::time::Duration::from_secs(2));
                                    app_clone.exit(0);
                                });
                            } else {
                                // No window, just quit immediately
                                app.exit(0);
                            }
                        }
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    match event {
                        // Handle double-click to toggle window
                        TrayIconEvent::DoubleClick { .. } => {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                // Toggle window visibility
                                if window.is_visible().unwrap_or(false) {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            // Handle window close event (minimize to tray instead of quitting)
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        // Prevent default close behavior
                        api.prevent_close();
                        
                        // Hide window instead of closing (no webhook on minimize)
                        let _ = window_clone.hide();
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_running_processes,
            get_installed_apps,
            browse_for_executable,
            kill_process,
            block_application,
            unblock_application,
            is_app_blocked,
            get_blocked_apps,
            send_discord_webhook,
            get_browser_processes,
            verify_pin,
            hash_pin,
            apply_website_blocks,
            remove_website_blocks,
            get_blocked_domains,
            notify_app_closing,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
