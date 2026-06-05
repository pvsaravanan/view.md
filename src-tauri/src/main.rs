#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::File;
use std::io::Read;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};
use tauri::http::Response;
use tauri_plugin_dialog::DialogExt;

// Helper function to percent-decode file paths (e.g. spaces/special chars in URL)
fn percent_decode(s: &str) -> String {
    let mut bytes = Vec::new();
    let mut chars = s.as_bytes().iter();
    while let Some(&b) = chars.next() {
        if b == b'%' {
            if let (Some(&h), Some(&l)) = (chars.next(), chars.next()) {
                let hex = vec![h, l];
                if let Ok(hex_str) = std::str::from_utf8(&hex) {
                    if let Ok(byte) = u8::from_str_radix(hex_str, 16) {
                        bytes.push(byte);
                        continue;
                    }
                }
            }
        }
        bytes.push(b);
    }
    String::from_utf8_lossy(&bytes).into_owned()
}

#[tauri::command]
async fn open_file_dialog(app: AppHandle) -> Result<Option<String>, String> {
    let (tx, rx) = std::sync::mpsc::channel();
    app.dialog()
        .file()
        .add_filter("Markdown Files", &["md", "markdown"])
        .pick_file(move |file_path| {
            let path = file_path.map(|p| p.to_string());
            let _ = tx.send(path);
        });
    rx.recv().map_err(|e| e.to_string())
}

#[tauri::command]
async fn read_file(file_path: String) -> Result<String, String> {
    std::fs::read_to_string(&file_path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_file(app: AppHandle, file_path: Option<String>, content: String) -> Result<Option<String>, String> {
    let target_path = match file_path {
        Some(path) => path,
        None => {
            let (tx, rx) = std::sync::mpsc::channel();
            app.dialog()
                .file()
                .set_file_name("untitled.md")
                .save_file(move |file_path| {
                    let path = file_path.map(|p| p.to_string());
                    let _ = tx.send(path);
                });
            match rx.recv().map_err(|e| e.to_string())? {
                Some(path) => path,
                None => return Ok(None)
            }
        }
    };
    std::fs::write(&target_path, content).map_err(|e| e.to_string())?;
    Ok(Some(target_path))
}

#[tauri::command]
async fn open_external(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(&["/C", "start", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();

                // Find if an md file was passed in the arguments
                for arg in args.iter().skip(1) {
                    if arg.ends_with(".md") || arg.ends_with(".markdown") || arg.ends_with(".txt") {
                        let _ = window.emit("file-opened", arg.clone());
                        break;
                    }
                }
            }
        }))
        .register_uri_scheme_protocol("view-media", |_app, request| {
            let uri = request.uri().to_string();
            // Expected URI format: view-media://localhost/C:/path/to/file or view-media://C:/path/to/file
            let mut path_part = uri.strip_prefix("view-media://").unwrap_or(&uri);
            if path_part.starts_with("localhost/") {
                path_part = &path_part["localhost/".len()..];
            }
            
            let decoded_path = percent_decode(path_part);
            let file_path = PathBuf::from(decoded_path);

            // On Windows, if path looks like "C:/...", ensure it is formatted correctly
            // (PathBuf on Windows handles forward/back slashes natively)
            if file_path.exists() && file_path.is_file() {
                if let Ok(mut file) = File::open(&file_path) {
                    let mut buffer = Vec::new();
                    if file.read_to_end(&mut buffer).is_ok() {
                        return Response::builder()
                            .header("Access-Control-Allow-Origin", "*")
                            .body(buffer)
                            .unwrap();
                    }
                }
            }

            Response::builder()
                .status(404)
                .body(Vec::new())
                .unwrap()
        })
        .setup(|app| {
            // Check command line arguments for startup file
            let mut startup_file = None;
            let args: Vec<String> = std::env::args().collect();
            for arg in args.iter().skip(1) {
                if arg.ends_with(".md") || arg.ends_with(".markdown") || arg.ends_with(".txt") {
                    startup_file = Some(arg.clone());
                    break;
                }
            }

            // Get the automatically created main window
            let window = app.get_webview_window("main").unwrap();

            if let Some(file) = startup_file {
                let w = window.clone();
                // Delay sending slightly so the frontend listener binds
                tauri::async_runtime::spawn(async move {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    let _ = w.emit("file-opened", file);
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_file_dialog,
            read_file,
            save_file,
            open_external
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
