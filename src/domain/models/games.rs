use std::collections::HashMap;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::prelude::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Game {
    key: u32,
    name: String,
    image: String,
    playtime: u32,
    last_played: DateTime<Utc>,
    link: String,
}

impl Game {
    pub fn new(
        key: u32,
        name: String,
        image: String,
        playtime: u32,
        last_played: u32,
        link: String,
    ) -> Self {
        let last_played = match DateTime::from_timestamp(last_played as i64 * 1000, 0) {
            Some(date) => date,
            None => Utc::now(),
        };

        Self {
            key,
            name,
            image,
            playtime,
            last_played,
            link,
        }
    }

    pub fn key(&self) -> u32 {
        self.key
    }

    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn image(&self) -> &str {
        &self.image
    }

    pub fn playtime(&self) -> u32 {
        self.playtime
    }

    pub fn last_played(&self) -> &DateTime<Utc> {
        &self.last_played
    }

    pub fn link(&self) -> &str {
        &self.link
    }
}