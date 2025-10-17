use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use sysinfo::{ProcessRefreshKind, System, ProcessesToUpdate};
use tauri::{State, Manager, Emitter};

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

#[tauri::command]
async fn get_running_processes() -> Result<Vec<AppInfo>, String> {
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
async fn get_installed_apps() -> Result<Vec<AppInfo>, String> {
    let mut apps = Vec::new();
    
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::System::Registry::{
            RegOpenKeyExW, RegEnumKeyExW, RegQueryValueExW, RegCloseKey,
            HKEY_LOCAL_MACHINE, KEY_READ
        };
        use windows::core::PCWSTR;
        
        unsafe {
            // Check common installation paths
            let uninstall_paths = vec![
                "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
                "SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
            ];
            
            for path in uninstall_paths {
                let path_wide: Vec<u16> = path.encode_utf16().chain(Some(0)).collect();
                let mut hkey = Default::default();
                
                if RegOpenKeyExW(
                    HKEY_LOCAL_MACHINE,
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
                            HKEY_LOCAL_MACHINE,
                            PCWSTR::from_raw(subkey_wide.as_ptr()),
                            0,
                            KEY_READ,
                            &mut subkey,
                        ).is_ok() {
                            // Get DisplayName
                            let display_name_key: Vec<u16> = "DisplayName".encode_utf16().chain(Some(0)).collect();
                            let mut buffer = vec![0u16; 256];
                            let mut buffer_size = (buffer.len() * 2) as u32;
                            
                            if RegQueryValueExW(
                                subkey,
                                PCWSTR::from_raw(display_name_key.as_ptr()),
                                None,
                                None,
                                Some(buffer.as_mut_ptr() as *mut u8),
                                Some(&mut buffer_size),
                            ).is_ok() {
                                let display_name = String::from_utf16_lossy(&buffer[..((buffer_size / 2) as usize).saturating_sub(1)]);
                                
                                if !display_name.is_empty() {
                                    // Try to get DisplayIcon first (usually points to the .exe)
                                    let display_icon_key: Vec<u16> = "DisplayIcon".encode_utf16().chain(Some(0)).collect();
                                    let mut icon_buffer = vec![0u16; 512];
                                    let mut icon_buffer_size = (icon_buffer.len() * 2) as u32;
                                    
                                    let exe_path = if RegQueryValueExW(
                                        subkey,
                                        PCWSTR::from_raw(display_icon_key.as_ptr()),
                                        None,
                                        None,
                                        Some(icon_buffer.as_mut_ptr() as *mut u8),
                                        Some(&mut icon_buffer_size),
                                    ).is_ok() {
                                        let icon_path = String::from_utf16_lossy(&icon_buffer[..((icon_buffer_size / 2) as usize).saturating_sub(1)]);
                                        // DisplayIcon often has ",0" at the end for icon index, remove it
                                        icon_path.split(',').next().unwrap_or("").trim().to_string()
                                    } else {
                                        String::new()
                                    };
                                    
                                    // Only add if we have a valid .exe path and it's not an uninstaller
                                    let exe_path_lower = exe_path.to_lowercase();
                                    if !exe_path.is_empty() 
                                        && exe_path_lower.ends_with(".exe")
                                        && !exe_path_lower.contains("uninstall")
                                        && !exe_path_lower.contains("uninst") {
                                        apps.push(AppInfo {
                                            name: display_name,
                                            path: exe_path,
                                            pid: None,
                                        });
                                    }
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
    
    // Sort and deduplicate by executable path (not name)
    // This prevents duplicate entries for the same application
    apps.sort_by(|a, b| a.path.to_lowercase().cmp(&b.path.to_lowercase()));
    apps.dedup_by(|a, b| a.path.to_lowercase() == b.path.to_lowercase());
    
    Ok(apps)
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
async fn send_discord_webhook(webhook_url: String, message: String) -> Result<bool, String> {
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
    // Simple hash comparison (in production, use proper password hashing like argon2)
    let input_hash = format!("{:x}", md5::compute(input_pin.as_bytes()));
    Ok(input_hash == stored_hash)
}

#[tauri::command]
fn hash_pin(pin: String) -> Result<String, String> {
    let hash = format!("{:x}", md5::compute(pin.as_bytes()));
    Ok(hash)
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
        .manage(BlockedApps(Arc::new(Mutex::new(HashMap::new()))))
        .setup(|app| {
            // Handle window close event (minimize to tray instead of quitting)
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { .. } = event {
                        // Don't prevent close for now - just emit event
                        // Later can add: api.prevent_close(); and window_clone.hide();
                        
                        // Emit event to frontend to send webhook
                        let _ = window_clone.emit("app-closing", ());
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_running_processes,
            get_installed_apps,
            kill_process,
            block_application,
            unblock_application,
            is_app_blocked,
            get_blocked_apps,
            send_discord_webhook,
            get_browser_processes,
            verify_pin,
            hash_pin,
            notify_app_closing,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
