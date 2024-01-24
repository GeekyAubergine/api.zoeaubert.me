use std::sync::Arc;

use axum::{extract::State, Json};
use axum_extra::protobuf::Protobuf;
use serde::Serialize;

use crate::{
    api_definitions,
    domain::models::{about::About, faq::Faq},
    infrastructure::app_state::AppState,
    prelude::*,
};

#[derive(Debug, Clone, Serialize)]
pub struct ResponseFaqData {
    faq_text: String,
}

impl From<Faq> for api_definitions::Faq {
    fn from(faq: Faq) -> Self {
        Self {
            text: faq.text().to_string(),
        }
    }
}

pub async fn get_faq_data_query(State(state): State<AppState>) -> Protobuf<api_definitions::Faq> {
    let faq = state.faq_repo().get_faq().await;

    Protobuf(faq.into())
}
