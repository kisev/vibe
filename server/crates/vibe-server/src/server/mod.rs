pub(crate) mod diarization;
mod form;
pub(crate) mod format;
mod routes;
mod stream;
pub(crate) mod transcription;
pub(crate) mod unload_timeout;

use std::net::SocketAddr;
use std::path::Path;
use std::sync::Arc;

use crate::engine::Engine;
use axum::extract::DefaultBodyLimit;
use axum::routing::{delete, get, post};
use axum::Router;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
use tower_http::trace::TraceLayer;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;
use whisper_rs::ContextOptions;

use crate::cli::AppConfig;

const MAX_UPLOAD_SIZE: usize = 15 << 30;

#[derive(Clone)]
pub(super) struct AppState {
    inner: Arc<Mutex<ServerState>>,
    unload_timeout: unload_timeout::UnloadTimeoutRuntime,
    config: AppConfig,
}

pub(super) struct ServerState {
    ctx: Option<Engine>,
    model_name: String,
    model_path: String,
    gpu_device: i32,
    no_gpu: bool,
}

impl ServerState {
    fn new() -> Self {
        Self {
            ctx: None,
            model_name: String::new(),
            model_path: String::new(),
            gpu_device: -1,
            no_gpu: false,
        }
    }

    fn load_model(&mut self, path: &str, gpu_device: i32, no_gpu: Option<bool>) -> anyhow::Result<()> {
        let matches_loaded_model = self.ctx.is_some()
            && self.model_path == path
            && self.gpu_device == gpu_device
            && no_gpu.is_none_or(|requested| requested == self.no_gpu);
        if matches_loaded_model {
            tracing::debug!("model already loaded, skipping");
            return Ok(());
        }

        self.unload_model();
        let no_gpu = no_gpu.unwrap_or(false);
        let ctx = Engine::load(path, ContextOptions { gpu_device, no_gpu }).inspect_err(|err| {
            tracing::error!(model = path, gpu_device, no_gpu, "failed to load model: {err:#}");
        })?;
        self.model_name = Path::new(path).file_name().unwrap_or_default().to_string_lossy().into_owned();
        self.model_path = path.to_string();
        self.gpu_device = gpu_device;
        self.no_gpu = no_gpu;
        self.ctx = Some(ctx);
        Ok(())
    }

    fn unload_model(&mut self) {
        self.ctx = None;
        self.model_name.clear();
        self.model_path.clear();
        self.gpu_device = -1;
        self.no_gpu = false;
    }
}

#[derive(OpenApi)]
#[openapi(
    paths(
        routes::health::health,
        routes::health::ready,
        routes::skill::skill,
        routes::models::load_model,
        routes::models::model_metadata,
        routes::models::unload_model,
        routes::models::list_models,
        routes::transcriptions::transcriptions
    ),
    components(schemas(
        HealthResponse,
        ReadyResponse,
        ModelLoadRequest,
        ModelStatusResponse,
        ModelMetadataRequest,
        ModelMetadataResponse,
        ErrorResponse,
        ModelListResponse,
        ModelInfo,
        crate::engine::EngineCapabilities,
        TextResponse,
        format::VerboseJson,
        format::VerboseSegment
    )),
    tags((name = "vibe-server", description = "vibe-server transcription server"))
)]
struct ApiDoc;

pub async fn serve(
    host: String,
    port: u16,
    initial_model: Option<String>,
    unload_timeout: unload_timeout::UnloadTimeout,
    config: AppConfig,
) -> anyhow::Result<()> {
    whisper_rs::set_verbose(config.verbose());
    let mut server_state = ServerState::new();
    if let Some(model) = initial_model.as_deref() {
        server_state.load_model(model, -1, Some(false))?;
    }

    let inner = Arc::new(Mutex::new(server_state));
    let state = AppState {
        unload_timeout: unload_timeout::UnloadTimeoutRuntime::start(unload_timeout, Arc::clone(&inner)),
        inner,
        config,
    };
    let ready_config = state.config;
    let app = Router::new()
        .route("/health", get(routes::health::health))
        .route("/ready", get(routes::health::ready))
        .route("/skill", get(routes::skill::skill))
        .route("/v1/models/load", post(routes::models::load_model))
        .route("/v1/models/metadata", post(routes::models::model_metadata))
        .route(
            "/v1/models",
            delete(routes::models::unload_model).get(routes::models::list_models),
        )
        .route("/v1/audio/transcriptions", post(routes::transcriptions::transcriptions))
        .merge(SwaggerUi::new("/docs").url("/openapi.json", ApiDoc::openapi()))
        .layer(DefaultBodyLimit::max(MAX_UPLOAD_SIZE))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind((host.as_str(), port)).await?;
    let addr = listener.local_addr()?;
    print_ready(addr, ready_config)?;

    axum::serve(listener, app).with_graceful_shutdown(shutdown_signal()).await?;
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        let _ = tokio::signal::ctrl_c().await;
    };

    #[cfg(unix)]
    let terminate = async {
        if let Ok(mut signal) = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            signal.recv().await;
        }
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}

fn print_ready(addr: SocketAddr, config: AppConfig) -> anyhow::Result<()> {
    println!(
        "{}",
        serde_json::to_string(&serde_json::json!({
            "status": "ready",
            "port": addr.port(),
            "version": config.version(),
            "commit": config.commit(),
        }))?
    );
    Ok(())
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub(super) struct HealthResponse {
    status: &'static str,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub(super) struct ReadyResponse {
    status: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<&'static str>,
}

#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub(super) struct ModelLoadRequest {
    path: String,
    gpu_device: Option<i32>,
    no_gpu: Option<bool>,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub(super) struct ModelStatusResponse {
    status: &'static str,
    model: String,
}

#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub(super) struct ModelMetadataRequest {
    path: String,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub(super) struct ModelMetadataResponse {
    format: &'static str,
    capabilities: crate::engine::EngineCapabilities,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub(super) struct ModelListResponse {
    object: &'static str,
    data: Vec<ModelInfo>,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub(super) struct ModelInfo {
    id: String,
    object: &'static str,
    created: i64,
    owned_by: &'static str,
    capabilities: crate::engine::EngineCapabilities,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub(super) struct TextResponse {
    text: String,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub(super) struct ErrorResponse {
    error: ErrorBody,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub(super) struct ErrorBody {
    code: &'static str,
    message: String,
}

/// The code a failed engine call reports. Running out of memory is the one failure a
/// client can act on, by reloading on the CPU when it was the GPU's, so it is named;
/// everything else is `internal_error` with the message for a human.
pub(super) fn engine_error_code(err: &anyhow::Error) -> &'static str {
    if matches!(
        err.downcast_ref::<gigaam_rs::Error>(),
        Some(gigaam_rs::Error::UnsupportedLanguage(_))
    ) {
        return "unsupported_language";
    }
    match err.downcast_ref::<whisper_rs::Error>() {
        Some(whisper_rs::Error::OutOfMemory { gpu: true, .. }) => "gpu_out_of_memory",
        Some(whisper_rs::Error::OutOfMemory { gpu: false, .. }) => "out_of_memory",
        _ => "internal_error",
    }
}

pub(super) fn engine_error_status(err: &anyhow::Error) -> axum::http::StatusCode {
    if engine_error_code(err) == "unsupported_language" {
        axum::http::StatusCode::BAD_REQUEST
    } else {
        axum::http::StatusCode::INTERNAL_SERVER_ERROR
    }
}

pub(super) fn error(status: axum::http::StatusCode, code: &'static str, message: &str) -> axum::response::Response {
    (
        status,
        axum::Json(ErrorResponse {
            error: ErrorBody {
                code,
                message: message.to_string(),
            },
        }),
    )
        .into_response()
}

use axum::response::IntoResponse;

#[cfg(test)]
mod tests {
    use super::*;

    /// The OpenAPI document clients and the desktop app read must keep
    /// describing the same capability contract now that GigaAM was added.
    #[test]
    fn openapi_schema_keeps_capability_fields() {
        let document = serde_json::to_value(ApiDoc::openapi()).expect("serialize OpenAPI");
        assert!(
            document["openapi"].as_str().is_some_and(|version| version.starts_with("3.")),
            "unexpected OpenAPI version: {:?}",
            document["openapi"]
        );
        assert!(document["paths"].get("/v1/audio/transcriptions").is_some());
        assert!(document["paths"].get("/v1/models/metadata").is_some());

        let capabilities = &document["components"]["schemas"]["EngineCapabilities"];
        let properties = capabilities["properties"].as_object().expect("EngineCapabilities properties");
        let expected = [
            "engine",
            "requires_vad",
            "languages",
            "language_detection",
            "streaming",
            "translation",
            "timestamps",
            "text_prompts",
            "max_input_seconds",
        ];
        for field in expected {
            assert!(properties.contains_key(field), "missing capability field {field}");
        }
        assert_eq!(properties.len(), expected.len(), "EngineCapabilities gained or lost fields");

        let metadata = &document["components"]["schemas"]["ModelMetadataResponse"];
        assert!(metadata["properties"].get("capabilities").is_some());
    }

    #[test]
    fn unsupported_language_maps_to_a_400() {
        let err = anyhow::Error::new(gigaam_rs::Error::UnsupportedLanguage("en".to_owned()));
        assert_eq!(engine_error_code(&err), "unsupported_language");
        assert_eq!(engine_error_status(&err), axum::http::StatusCode::BAD_REQUEST);

        let response = error(engine_error_status(&err), engine_error_code(&err), &err.to_string());
        assert_eq!(response.status(), axum::http::StatusCode::BAD_REQUEST);
    }

    #[test]
    fn unexpected_engine_errors_stay_internal() {
        let err = anyhow::anyhow!("boom");
        assert_eq!(engine_error_code(&err), "internal_error");
        assert_eq!(engine_error_status(&err), axum::http::StatusCode::INTERNAL_SERVER_ERROR);
    }
}
