use std::collections::HashMap;

use axum::{extract::State, routing::get, Json, Router};
use serde::Serialize;

use crate::{
    infrastructure::app_state::AppState, application::queries::{get_all_lego_data_query::get_all_lego_data_query, get_all_games_data_query::get_all_games_data_query},
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(root))
        .route("/lego", get(get_all_lego_data_query))
        .route("/games", get(get_all_games_data_query))
}

async fn root() -> &'static str {
    "Hello, Worsdfld!"
}
