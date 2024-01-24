use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use axum_extra::protobuf::Protobuf;
use serde::Serialize;

use crate::{domain::models::about::About, infrastructure::app_state::AppState, prelude::*, api_definitions};

impl From<About> for api_definitions::About {
    fn from(about: About) -> Self {
        Self {
            text: about.text().to_string(),
        }
    }
}

pub async fn query_get_about_data(State(state): State<AppState>) -> Protobuf<api_definitions::About> {
    let about = state.about_repo().get_about().await;

    Protobuf(about.into())
}
