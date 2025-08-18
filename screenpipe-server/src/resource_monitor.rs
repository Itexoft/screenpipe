use chrono::Local;
use serde_json::{Value, json};
use std::env;
use std::fs::File;
use std::fs::OpenOptions;
use std::io::Read;
use std::io::Seek;
use std::io::SeekFrom;
use std::io::Write;
use std::sync::Arc;
use std::time::{Duration, Instant};
use sysinfo::{PidExt, ProcessExt, System, SystemExt};
use tracing::{error, info};

pub struct ResourceMonitor {
    start_time: Instant,
    resource_log_file: Option<String>,
}

pub enum RestartSignal {
    RecordingTasks,
}

impl ResourceMonitor {
    pub fn new(_telemetry_enabled: bool) -> Arc<Self> {
        let resource_log_file = if env::var("SAVE_RESOURCE_USAGE").is_ok() {
            let now = Local::now();
            let filename = format!("resource_usage_{}.json", now.format("%Y%m%d_%H%M%S"));
            info!("Resource usage data will be saved to file: {}", filename);

            // Initialize the file with an empty JSON array
            if let Ok(mut file) = File::create(&filename) {
                if let Err(e) = file.write_all(b"[]") {
                    error!("Failed to initialize JSON file: {}", e);
                }
            } else {
                error!("Failed to create JSON file: {}", filename);
            }

            Some(filename)
        } else {
            None
        };

        Arc::new(Self {
            start_time: Instant::now(),
            resource_log_file,
        })
    }


    async fn collect_metrics(&self, sys: &System) -> (f64, f64, f64, f32, f64, Duration) {
        let pid = std::process::id();
        let mut total_memory = 0.0;
        let mut max_virtual_memory = 0.0; // Changed from total to max
        let mut total_cpu = 0.0;

        if let Some(main_process) = sys.process(sysinfo::Pid::from_u32(pid)) {
            total_memory += main_process.memory() as f64 / (1024.0 * 1024.0 * 1024.0);

            // Take the maximum virtual memory instead of sum
            max_virtual_memory = main_process.virtual_memory() as f64 / (1024.0 * 1024.0 * 1024.0);

            total_cpu += main_process.cpu_usage();

            // Add child processes
            for child_process in sys.processes().values() {
                if child_process.parent() == Some(sysinfo::Pid::from_u32(pid)) {
                    total_memory += child_process.memory() as f64 / (1024.0 * 1024.0 * 1024.0);

                    // Take max instead of sum
                    max_virtual_memory = max_virtual_memory
                        .max(child_process.virtual_memory() as f64 / (1024.0 * 1024.0 * 1024.0));

                    total_cpu += child_process.cpu_usage();
                }
            }
        }

        let system_total_memory = sys.total_memory() as f64 / (1024.0 * 1024.0 * 1024.0);
        let memory_usage_percent = (total_memory / system_total_memory) * 100.0;
        let runtime = self.start_time.elapsed();

        (
            total_memory,
            system_total_memory,
            memory_usage_percent,
            total_cpu,
            max_virtual_memory,
            runtime,
        )
    }

    async fn log_to_file(&self, metrics: (f64, f64, f64, f32, f64, Duration)) {
        let (
            total_memory_gb,
            system_total_memory,
            memory_usage_percent,
            total_cpu,
            total_virtual_memory_gb,
            runtime,
        ) = metrics;

        if let Some(ref filename) = self.resource_log_file {
            let json_data = json!({
                "timestamp": Local::now().to_rfc3339(),
                "runtime_seconds": runtime.as_secs(),
                "total_memory_gb": total_memory_gb,
                "system_total_memory_gb": system_total_memory,
                "memory_usage_percent": memory_usage_percent,
                "total_cpu_percent": total_cpu,
                "total_virtual_memory_gb": total_virtual_memory_gb,
            });

            if let Ok(mut file) = OpenOptions::new().read(true).write(true).open(filename) {
                let mut contents = String::new();
                if file.read_to_string(&mut contents).is_ok() {
                    if let Ok(mut json_array) = serde_json::from_str::<Value>(&contents) {
                        if let Some(array) = json_array.as_array_mut() {
                            array.push(json_data);
                            if file.set_len(0).is_ok() && file.seek(SeekFrom::Start(0)).is_ok() {
                                if let Err(e) = file.write_all(json_array.to_string().as_bytes()) {
                                    error!("Failed to write JSON data to file: {}", e);
                                }
                            }
                        }
                    }
                }
                let _ = file.flush();
            }
        }
    }

    async fn log_status(&self, sys: &System) {
        let metrics = self.collect_metrics(sys).await;
        let (
            total_memory_gb,
            system_total_memory,
            memory_usage_percent,
            total_cpu,
            total_virtual_memory_gb,
            runtime,
        ) = metrics;

        // Log to console with virtual memory
        let log_message = format!(
            "Runtime: {}s, Memory: {:.0}% ({:.2} GB / {:.2} GB), Virtual: {:.2} GB, CPU: {:.0}%",
            runtime.as_secs(),
            memory_usage_percent,
            total_memory_gb,
            system_total_memory,
            total_virtual_memory_gb,
            total_cpu
        );
        info!("{}", log_message);

        // Log to file
        self.log_to_file(metrics).await;

        self.log_to_file(metrics).await;
    }

    pub fn start_monitoring(
        self: &Arc<Self>,
        interval: Duration,
        _unused: Option<Duration>,
    ) {
        let monitor = Arc::clone(self);

        tokio::spawn(async move {
            let mut sys = System::new_all();

            loop {
                tokio::select! {
                    _ = tokio::time::sleep(interval) => {
                        sys.refresh_all();
                        monitor.log_status(&sys).await;
                    }
                }
            }
        });
    }

    pub async fn shutdown(&self) {
        if let Some(ref file) = self.resource_log_file {
            if let Ok(mut f) = OpenOptions::new().write(true).open(file) {
                let _ = f.flush();
            }
        }

        tokio::time::sleep(Duration::from_millis(100)).await;
    }
}
