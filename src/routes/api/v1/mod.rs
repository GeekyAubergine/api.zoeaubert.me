use std::collections::HashMap;

use axum::{extract::State, routing::get, Json, Router};
use serde::Serialize;

use crate::{
    app_state::AppState,
    models::{
        data::Data,
        lego::{LegoCollection, LegoSet},
    },
};

use self::lego::lego;

mod lego;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(root))
        .route("/test", get(test))
        .route("/lego", get(lego))
}

async fn root() -> &'static str {
    "Hello, Worsdfld!"
}

async fn test(State(state): State<AppState>) -> Json<Data> {
    Json(state.data().read().await.clone())
}
