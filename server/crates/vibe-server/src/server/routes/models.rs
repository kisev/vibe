use std::time::{SystemTime, UNIX_EPOCH};

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;

use crate::server::{
    error, AppState, ModelInfo, ModelListResponse, ModelLoadRequest, ModelMetadataRequest, ModelMetadataResponse,
    ModelStatusResponse,
};

#[utoipa::path(
    post,
    path = "/v1/models/metadata",
    request_body = ModelMetadataRequest,
    responses(
        (status = 200, description = "Model metadata", body = ModelMetadataResponse),
        (status = 400, description = "Unsupported or invalid model", body = crate::server::ErrorResponse)
    )
)]
pub(in crate::server) async fn model_metadata(Json(request): Json<ModelMetadataRequest>) -> Response {
    if request.path.trim().is_empty() {
        return error(
            StatusCode::BAD_REQUEST,
            "invalid_request",
            "request body must contain a model path",
        );
    }
    let path = request.path.clone();
    match tokio::task::spawn_blocking(move || {
        crate::engine::detect_model(&path).map_err(|err| {
            tracing::error!(model = path, "model metadata check failed: {err:#}");
            err.to_string()
        })
    })
    .await
    {
        Ok(Ok(capabilities)) => (
            StatusCode::OK,
            Json(ModelMetadataResponse {
                format: if capabilities.engine == "whisper" { "whisper" } else { "gguf" },
                capabilities,
            }),
        )
            .into_response(),
        Ok(Err(message)) => error(StatusCode::BAD_REQUEST, "unsupported_model", &message),
        Err(err) => error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "internal_error",
            &format!("metadata task failed: {err}"),
        ),
    }
}

#[utoipa::path(
    post,
    path = "/v1/models/load",
    request_body = ModelLoadRequest,
    responses(
        (status = 200, description = "Model loaded", body = ModelStatusResponse),
        (status = 400, description = "Invalid request", body = crate::server::ErrorResponse),
        (status = 500, description = "Load failed", body = crate::server::ErrorResponse)
    )
)]
pub(in crate::server) async fn load_model(State(state): State<AppState>, Json(request): Json<ModelLoadRequest>) -> Response {
    if request.path.trim().is_empty() {
        return error(
            StatusCode::BAD_REQUEST,
            "invalid_request",
            "request body must contain {\"path\": \"...\"}",
        );
    }

    let mut model = state.unload_timeout.acquire(state.inner.clone()).await;
    let gpu_device = request.gpu_device.unwrap_or(-1);
    match model.load_model(&request.path, gpu_device, request.no_gpu) {
        Ok(()) => (
            StatusCode::OK,
            Json(ModelStatusResponse {
                status: "loaded",
                model: model.model_name.clone(),
            }),
        )
            .into_response(),
        Err(err) => error(
            StatusCode::INTERNAL_SERVER_ERROR,
            crate::server::engine_error_code(&err),
            &format!("failed to load model: {err}"),
        ),
    }
}

#[utoipa::path(
    delete,
    path = "/v1/models",
    responses((status = 200, description = "Model unloaded", body = serde_json::Value))
)]
pub(in crate::server) async fn unload_model(State(state): State<AppState>) -> impl IntoResponse {
    state.inner.lock().await.unload_model();
    (StatusCode::OK, Json(serde_json::json!({ "status": "unloaded" })))
}

#[utoipa::path(
    get,
    path = "/v1/models",
    responses((status = 200, description = "OpenAI-style model list", body = ModelListResponse))
)]
pub(in crate::server) async fn list_models(State(state): State<AppState>) -> impl IntoResponse {
    let state = state.inner.lock().await;
    let data = if let Some(engine) = state.ctx.as_ref() {
        vec![ModelInfo {
            id: state.model_name.clone(),
            object: "model",
            created: now_unix(),
            owned_by: "local",
            capabilities: engine.capabilities(),
        }]
    } else {
        Vec::new()
    };
    (StatusCode::OK, Json(ModelListResponse { object: "list", data }))
}

fn now_unix() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs() as i64)
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use axum::body::to_bytes;

    use super::*;

    /// Minimal GGUF v3 file: one string metadata key, no tensors.
    fn gguf_with_architecture(architecture: &str) -> tempfile::NamedTempFile {
        let mut out = Vec::new();
        out.extend_from_slice(b"GGUF");
        out.extend_from_slice(&3u32.to_le_bytes()); // version
        out.extend_from_slice(&0u64.to_le_bytes()); // tensor count
        out.extend_from_slice(&1u64.to_le_bytes()); // metadata count
        let key = "general.architecture";
        out.extend_from_slice(&(key.len() as u64).to_le_bytes());
        out.extend_from_slice(key.as_bytes());
        out.extend_from_slice(&8u32.to_le_bytes()); // string value type
        out.extend_from_slice(&(architecture.len() as u64).to_le_bytes());
        out.extend_from_slice(architecture.as_bytes());
        let file = tempfile::NamedTempFile::new().unwrap();
        std::fs::write(file.path(), out).unwrap();
        file
    }

    #[tokio::test]
    async fn metadata_rejects_an_unsupported_gguf_architecture() {
        let file = gguf_with_architecture("llama");
        let path = file.path().to_string_lossy().into_owned();
        let response = model_metadata(Json(ModelMetadataRequest { path })).await;
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let value: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(value["error"]["code"], "unsupported_model");
        let message = value["error"]["message"].as_str().unwrap();
        assert!(
            message.contains("llama"),
            "message should name the architecture, got {message}"
        );
    }
}
