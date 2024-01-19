use std::collections::HashMap;

use axum::{extract::State, Json};
use serde::Serialize;

use crate::{
    domain::models::lego::{LegoMinifig, LegoSet},
    prelude::*, infrastructure::app_state::AppState,
};

#[derive(Debug, Clone, Serialize)]
pub struct ResponseLegoSet {
    key: u32,
    name: String,
    number: String,
    category: String,
    pieces: u32,
    image: String,
    thumbnail: String,
    link: String,
    quantity: u32,
}

impl From<LegoSet> for ResponseLegoSet {
    fn from(set: LegoSet) -> Self {
        Self {
            key: set.key(),
            name: set.name().to_string(),
            number: set.number().to_string(),
            category: set.category().to_string(),
            pieces: set.pieces(),
            image: set.image().to_string(),
            thumbnail: set.thumbnail().to_string(),
            link: set.link().to_string(),
            quantity: set.quantity(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ResponseMinifig {
    key: String,
    name: String,
    category: String,
    owned_in_sets: u32,
    owned_loose: u32,
    total_owned: u32,
    image_url: String,
}

impl From<LegoMinifig> for ResponseMinifig {
    fn from(minifig: LegoMinifig) -> Self {
        Self {
            key: minifig.key().to_string(),
            name: minifig.name().to_string(),
            category: minifig.category().to_string(),
            owned_in_sets: minifig.owned_in_sets(),
            owned_loose: minifig.owned_loose(),
            total_owned: minifig.total_owned(),
            image_url: minifig.image_url().to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ResponseLegoSets {
    sets: HashMap<u32, ResponseLegoSet>,
    set_keys: Vec<u32>,
    minifigs: HashMap<String, ResponseMinifig>,
    minifig_keys: Vec<String>,
    total_pieces: u32,
}

pub async fn get_all_lego_data_query(State(state): State<AppState>) -> Json<ResponseLegoSets> {
    let sets = state
        .lego_repo()
        .get_all_sets()
        .await
        .into_iter()
        .map(|(key, set)| (key, ResponseLegoSet::from(set)))
        .collect::<HashMap<u32, ResponseLegoSet>>();

    let set_keys = state.lego_repo().get_most_piece_sets().await;

    let minifigs = state
        .lego_repo()
        .get_all_minifigs()
        .await
        .into_iter()
        .map(|(key, minifig)| (key, ResponseMinifig::from(minifig)))
        .collect::<HashMap<String, ResponseMinifig>>();
    let minifig_keys = state.lego_repo().get_most_owned_minifigs().await;

    let total_pieces = state.lego_repo().get_total_pieces().await;

    Json(ResponseLegoSets {
        sets,
        set_keys,
        minifigs,
        minifig_keys,
        total_pieces,
    })
}