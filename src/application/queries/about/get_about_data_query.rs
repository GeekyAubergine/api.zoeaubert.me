use axum::{extract::State, Json};
use serde::Serialize;

use crate::{prelude::*, domain::models::about::About, infrastructure::app_state::AppState};

#[derive(Debug, Clone, Serialize)]
pub struct ResponseAboutData {
    about_text: String,
}

impl From<About> for ResponseAboutData {
    fn from(about: About) -> Self {
        Self {
            about_text: about.text().to_string(),
        }
    }
}

pub async fn query_get_about_data(State(state): State<AppState>) -> Json<ResponseAboutData> {
    let about = state.about_repo().get_about().await;

    Json(about.into())
}