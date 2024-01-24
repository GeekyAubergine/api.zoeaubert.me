use std::collections::HashMap;

use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use axum_extra::protobuf::Protobuf;
use chrono::{DateTime, Utc};
use serde::Serialize;

use crate::{
    domain::models::games::Game, infrastructure::app_state::AppState, prelude::*, api_definitions,
};

const RECENT_GAMES_COUNT: usize = 3;

impl From<Game> for api_definitions::Game {
    fn from(game: Game) -> Self {
        Self {
            id: game.key(),
            name: game.name().to_string(),
            image_url: game.image().to_string(),
            playtime: game.playtime(),
            last_played: game.last_played().to_string(),
            link_url: game.link().to_string(),
        }
    }
}

pub async fn get_all_games_data_query(State(state): State<AppState>) -> Protobuf<api_definitions::Games> {
    let games = state
        .games_repo()
        .get_all_games()
        .await
        .iter()
        .map(|(key, game)| (*key, game.clone().into()))
        .collect::<HashMap<u32, api_definitions::Game>>();

    let games_keys = games.keys().cloned().collect::<Vec<u32>>();

    let games_by_last_played = state.games_repo().get_most_recently_played_keys().await;

    let games_by_playtime = state.games_repo().get_most_played_keys().await;

    let total_playtime = state.games_repo().get_total_play_time().await;

    Protobuf(api_definitions::Games {
        games,
        game_ids: games_keys,
        games_by_last_played,
        games_by_playtime,
        total_playtime,
    })
}
