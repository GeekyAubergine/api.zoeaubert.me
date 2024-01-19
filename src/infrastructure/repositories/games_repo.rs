use std::{collections::HashMap, sync::Arc};

use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

use crate::{domain::models::games::Game, get_json, infrastructure::config::Config, prelude::*};

const GAMES_URL: &str =
  "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?format=json&include_appinfo=true";

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SteamGame {
    appid: u32,
    name: String,
    playtime_forever: u32,
    img_icon_url: String,
    rtime_last_played: u32,
}

impl From<SteamGame> for Game {
    fn from(game: SteamGame) -> Self {
        let link = format!(
            "https://store.steampowered.com/app/{}/{}",
            game.appid,
            game.name.replace(' ', "_")
        );

        let image = format!(
            "https://steamcdn-a.akamaihd.net/steam/apps/{}/header.jpg",
            game.appid
        );

        Game::new(
            game.appid,
            game.name,
            image,
            game.playtime_forever,
            game.rtime_last_played,
            link,
        )
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetGamesResponseInner {
    game_count: u32,
    games: Vec<SteamGame>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetGamesResponse {
    response: GetGamesResponseInner,
}

fn make_get_url(config: &Config) -> String {
    format!(
        "{}&key={}&steamid={}",
        GAMES_URL,
        config.steam().api_key(),
        config.steam().steam_id()
    )
}

#[derive(Debug, Clone, Default)]
pub struct GamesRepo {
    steam_games: Arc<RwLock<HashMap<u32, SteamGame>>>,
}

impl GamesRepo {
    pub fn new() -> Self {
        Self {
            steam_games: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn reload(&mut self, config: &Config) -> Result<()> {
        let games = get_json::<GetGamesResponse>(&make_get_url(config)).await?;

        let steam_games = games
            .response
            .games
            .into_iter()
            .map(|g| (g.appid, g.into()))
            .collect::<HashMap<u32, SteamGame>>();

        let mut steam_games_ref = self.steam_games.write().await;

        *steam_games_ref = steam_games;

        Ok(())
    }

    pub async fn get_all_games(&self) -> HashMap<u32, Game> {
        let games = self.steam_games.read().await;

        games
            .iter()
            .map(|(key, game)| (*key, game.clone().into()))
            .collect()
    }

    pub async fn get_most_recently_played_keys(&self) -> Vec<u32> {
        let games = self.steam_games.read().await;

        let mut games_array = games.values().cloned().collect::<Vec<SteamGame>>();

        games_array.sort_by(|a, b| b.rtime_last_played.cmp(&a.rtime_last_played));

        games_array
            .iter()
            .map(|game| game.appid)
            .collect::<Vec<u32>>()
    }

    pub async fn get_most_played_keys(&self) -> Vec<u32> {
        let games = self.steam_games.read().await;

        let mut games_array = games.values().cloned().collect::<Vec<SteamGame>>();

        games_array.sort_by(|a, b| b.playtime_forever.cmp(&a.playtime_forever));

        games_array
            .iter()
            .map(|game| game.appid)
            .collect::<Vec<u32>>()
    }

    pub async fn get_total_play_time(&self) -> u32 {
        let games = self.steam_games.read().await;

        games.values().map(|game| game.playtime_forever).sum()
    }
}
