use std::collections::HashMap;

use axum::{extract::State, Json};
use axum_extra::protobuf::Protobuf;
use serde::Serialize;

use crate::{
    api_definitions,
    domain::models::lego::{LegoMinifig, LegoSet},
    infrastructure::app_state::AppState,
    prelude::*,
};

impl From<LegoSet> for api_definitions::LegoSet {
    fn from(set: LegoSet) -> Self {
        Self {
            id: set.key(),
            name: set.name().to_string(),
            number: set.number().to_string(),
            category: set.category().to_string(),
            pieces: set.pieces(),
            image_url: set.image().to_string(),
            thumbnail_url: set.thumbnail().to_string(),
            link_url: set.link().to_string(),
            quantity: set.quantity(),
        }
    }
}

impl From<LegoMinifig> for api_definitions::LegoMinifig {
    fn from(minifig: LegoMinifig) -> Self {
        Self {
            id: minifig.key().to_owned(),
            name: minifig.name().to_string(),
            category: minifig.category().to_string(),
            owned_in_sets: minifig.owned_in_sets(),
            owned_loose: minifig.owned_loose(),
            image_url: minifig.image_url().to_string(),
        }
    }
}

pub async fn get_all_lego_data_query(
    State(state): State<AppState>,
) -> Protobuf<api_definitions::LegoCollection> {
    let sets = state
        .lego_repo()
        .get_all_sets()
        .await
        .into_iter()
        .map(|(key, set)| (key, set.into()))
        .collect::<HashMap<u32, api_definitions::LegoSet>>();

    let set_ids = state.lego_repo().get_most_piece_sets().await;

    let minifigs = state
        .lego_repo()
        .get_all_minifigs()
        .await
        .into_iter()
        .map(|(key, minifig)| (key, minifig.into()))
        .collect::<HashMap<String, api_definitions::LegoMinifig>>();
    let minifig_ids = state.lego_repo().get_most_owned_minifigs().await;

    let total_pieces = state.lego_repo().get_total_pieces().await;

    Protobuf(api_definitions::LegoCollection {
        sets,
        set_ids,
        minifigs,
        minifig_ids,
        total_pieces,
    })
}
