use std::collections::HashMap;

use axum::{extract::State, Json};
use chrono::{DateTime, Utc};
use serde::Serialize;

use crate::{domain::models::games::Game, infrastructure::app_state::AppState, prelude::*};

const RECENT_GAMES_COUNT: usize = 3;

#[derive(Debug, Clone, Serialize)]
pub struct ResponseGame {
    key: u32,
    name: String,
    image: String,
    playtime: u32,
    last_played: DateTime<Utc>,
    link: String,
}

impl From<Game> for ResponseGame {
    fn from(game: Game) -> Self {
        Self {
            key: game.key(),
            name: game.name().to_string(),
            image: game.image().to_string(),
            playtime: game.playtime(),
            last_played: *game.last_played(),
            link: game.link().to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ResponseGames {
    games: HashMap<u32, ResponseGame>,
    game_keys: Vec<u32>,
    games_by_last_played: Vec<u32>,
    games_by_play_time: Vec<u32>,
    total_play_time: u32,
}

pub async fn get_all_games_data_query(State(state): State<AppState>) -> Json<ResponseGames> {
    let games = state
        .games_repo()
        .get_all_games()
        .await
        .iter()
        .map(|(key, game)| (*key, game.clone().into()))
        .collect::<HashMap<u32, ResponseGame>>();

    let games_keys = games.keys().cloned().collect::<Vec<u32>>();

    let games_by_last_played = state.games_repo().get_most_recently_played_keys().await;

    let games_by_play_time = state.games_repo().get_most_played_keys().await;

    let total_play_time = state.games_repo().get_total_play_time().await;

    Json(ResponseGames {
        games,
        game_keys: games_keys,
        games_by_last_played,
        games_by_play_time,
        total_play_time,
    })
}
