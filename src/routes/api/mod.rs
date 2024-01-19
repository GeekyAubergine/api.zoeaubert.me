use std::collections::HashMap;

use axum::Router;
mod v1;

use crate::infrastructure::app_state::AppState;

pub fn api_routes() -> Router<AppState> {
    Router::new().nest("/v1", v1::routes())
}
