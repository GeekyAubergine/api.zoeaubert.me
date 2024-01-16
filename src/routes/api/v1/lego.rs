use std::collections::HashMap;

use axum::{extract::State, Json};
use serde::Serialize;

use crate::{app_state::AppState, models::lego::{LegoSet, LegoMinifig}};

#[derive(Debug, Clone, Serialize)]
pub struct ApiLegoSet {
    key: u32,
    name: String,
    number: String,
    category: String,
    pieces: u32,
    image: String,
    thumbnail: String,
    brickset_url: String,
    quantity: u32,
}

impl From<LegoSet> for ApiLegoSet {
    fn from(set: LegoSet) -> Self {
        Self {
            key: set.key(),
            name: set.name().to_string(),
            number: set.number().to_string(),
            category: set.category().to_string(),
            pieces: set.pieces(),
            image: set.image().to_string(),
            thumbnail: set.thumbnail().to_string(),
            brickset_url: set.brickset_url().to_string(),
            quantity: set.quantity(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ApiMinifig {
    key: String,
    name: String,
    category: String,
    owned_in_sets: u32,
    owned_loose: u32,
    image_url: String,
    total_owned: u32,
}

impl From<LegoMinifig> for ApiMinifig {
    fn from(minifig: LegoMinifig) -> Self {
        Self {
            key: minifig.key().to_string(),
            name: minifig.name().to_string(),
            category: minifig.category().to_string(),
            owned_in_sets: minifig.owned_in_sets(),
            owned_loose: minifig.owned_loose(),
            image_url: minifig.image_url().to_string(),
            total_owned: minifig.total_owned(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct LegoCollection {
    sets: HashMap<u32, ApiLegoSet>,
    minifigs: HashMap<String, ApiMinifig>,
    sets_order: Vec<u32>,
    minifigs_order: Vec<String>,
    total_pieces: u32,
}

impl From<crate::models::lego::LegoCollection> for LegoCollection {
    fn from(collection: crate::models::lego::LegoCollection) -> Self {
        let sets = collection
            .sets()
            .values()
            .map(|set| (set.key(), ApiLegoSet::from(set.clone())))
            .collect();

        let minifigs = collection
            .minifigs()
            .values()
            .map(|minifig| (minifig.key().to_string(), ApiMinifig::from(minifig.clone())))
            .collect();

        Self {
            sets,
            minifigs,
            sets_order: collection.sets_order().clone(),
            minifigs_order: collection.minifigs_order().clone(),
            total_pieces: collection.total_pieces(),
        }
    }
}

pub async fn lego(State(state): State<AppState>) -> Json<LegoCollection> {
    Json(LegoCollection::from(
        state.data().read().await.lego().clone(),
    ))
}
