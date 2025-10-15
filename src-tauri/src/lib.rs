use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use sysinfo::{ProcessRefreshKind, System, ProcessesToUpdate};
use tauri::State;

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
    
    apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    apps.dedup_by(|a, b| a.name.to_lowercase() == b.name.to_lowercase());
    
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(BlockedApps(Arc::new(Mutex::new(HashMap::new()))))
        .invoke_handler(tauri::generate_handler![
            get_running_processes,
            kill_process,
            block_application,
            unblock_application,
            is_app_blocked,
            get_blocked_apps,
            send_discord_webhook,
            get_browser_processes,
            verify_pin,
            hash_pin,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
