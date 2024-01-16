use axum::{Router, routing::get, Json, extract::State};

use crate::{app_state::AppState, models::data::Data};

pub fn api_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(root))
        .route("/test", get(test))
}

async fn root() -> &'static str {
    "Hello, Worsdfld!"
}

async fn test(State(state): State<AppState>) -> Json<Data> {
    Json(state.data().read().unwrap().clone())
}