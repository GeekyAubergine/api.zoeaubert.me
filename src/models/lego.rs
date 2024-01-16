use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::prelude::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LegoSet {
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

impl LegoSet {
    pub fn new(
        key: u32,
        name: String,
        number: String,
        category: String,
        pieces: u32,
        image: String,
        thumbnail: String,
        brickset_url: String,
        quantity: u32,
    ) -> Self {
        Self {
            key,
            name,
            number,
            category,
            pieces,
            image,
            thumbnail,
            brickset_url,
            quantity,
        }
    }

    pub fn key(&self) -> u32 {
        self.key
    }

    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn number(&self) -> &str {
        &self.number
    }

    pub fn category(&self) -> &str {
        &self.category
    }

    pub fn pieces(&self) -> u32 {
        self.pieces
    }

    pub fn image(&self) -> &str {
        &self.image
    }

    pub fn thumbnail(&self) -> &str {
        &self.thumbnail
    }

    pub fn brickset_url(&self) -> &str {
        &self.brickset_url
    }

    pub fn quantity(&self) -> u32 {
        self.quantity
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct LegoMinifig {
    key: String,
    name: String,
    category: String,
    owned_in_sets: u32,
    owned_loose: u32,
}

impl LegoMinifig {
    pub fn new(
        key: String,
        name: String,
        category: String,
        owned_in_sets: u32,
        owned_loose: u32,
    ) -> Self {
        Self {
            key,
            name,
            category,
            owned_in_sets,
            owned_loose,
        }
    }

    pub fn key(&self) -> &str {
        &self.key
    }

    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn category(&self) -> &str {
        &self.category
    }

    pub fn owned_in_sets(&self) -> u32 {
        self.owned_in_sets
    }

    pub fn owned_loose(&self) -> u32 {
        self.owned_loose
    }

    pub fn total_owned(&self) -> u32 {
        self.owned_in_sets + self.owned_loose
    }

    pub fn image_url(&self) -> String {
        format!("https://img.bricklink.com/ItemImage/MN/0/{}.png", self.key)
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct LegoCollection {
    sets: HashMap<u32, LegoSet>,
    minifigs: HashMap<String, LegoMinifig>,
    sets_order: Vec<u32>,
    minifigs_order: Vec<String>,
    total_pieces: u32,
}

impl LegoCollection {
    pub fn new() -> Self {
        Self {
            sets: HashMap::new(),
            minifigs: HashMap::new(),
            sets_order: Vec::new(),
            minifigs_order: Vec::new(),
            total_pieces: 0,
        }
    }

    fn recalculate(&mut self) {
        self.total_pieces = self.sets.values().map(|set| set.pieces()).sum();

        let mut sets = self.sets.values().collect::<Vec<&LegoSet>>();
        sets.sort_by_key(|a| a.pieces());
        self.sets_order = sets.iter().map(|set| set.key()).rev().collect();

        let mut minifigs = self.minifigs.values().collect::<Vec<&LegoMinifig>>();
        minifigs.sort_by_key(|a| a.total_owned());
        self.minifigs_order = minifigs
            .iter()
            .map(|minifig| minifig.key().to_string())
            .rev()
            .collect();
    }

    pub fn add_sets(&mut self, sets: Vec<LegoSet>) {
        for set in sets {
            self.sets.insert(set.key(), set);
        }
        self.recalculate();
    }

    pub fn sets(&self) -> &HashMap<u32, LegoSet> {
        &self.sets
    }

    pub fn sets_mut(&mut self) -> &mut HashMap<u32, LegoSet> {
        &mut self.sets
    }

    pub fn add_minifigs(&mut self, minifigs: Vec<LegoMinifig>) {
        for minifig in minifigs {
            self.minifigs.insert(minifig.key().to_string(), minifig);
        }
        self.recalculate();
    }

    pub fn minifigs(&self) -> &HashMap<String, LegoMinifig> {
        &self.minifigs
    }

    pub fn minifigs_mut(&mut self) -> &mut HashMap<String, LegoMinifig> {
        &mut self.minifigs
    }

    pub fn sets_order(&self) -> &Vec<u32> {
        &self.sets_order
    }

    pub fn minifigs_order(&self) -> &Vec<String> {
        &self.minifigs_order
    }

    pub fn total_pieces(&self) -> u32 {
        self.total_pieces
    }
}
