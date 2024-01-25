use std::{collections::HashMap, sync::Arc};

use serde::{Deserialize, Serialize};
use tokio::{sync::RwLock, task::JoinSet};

use crate::{domain::models::games::Game, get_json, infrastructure::config::Config, prelude::*};

const GAMES_URL: &str =
  "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?format=json&include_appinfo=true";

const ACHEIVEMENTS_URL: &str =
    "http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?format=json";

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SteamAcheivement {
    name: String,
    #[serde(rename = "displayName")]
    display_name: String,
    description: String,
    #[serde(rename = "icon")]
    image_unlocked_url: String,
    #[serde(rename = "icongray")]
    image_locked_url: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SteamGameAchievement {
    apiname: String,
    achieved: u8,
    unlocktime: u32,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SteamGame {
    appid: u32,
    name: String,
    playtime_forever: u32,
    img_icon_url: String,
    rtime_last_played: u32,
    achievements: Option<Vec<SteamGameAchievement>>,
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
struct GetGamesResponseInner {
    game_count: u32,
    games: Vec<SteamGame>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
struct GetGamesResponse {
    response: GetGamesResponseInner,
}

fn make_get_games_url(config: &Config) -> String {
    format!(
        "{}&key={}&steamid={}",
        GAMES_URL,
        config.steam().api_key(),
        config.steam().steam_id()
    )
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
struct GetGameAchievementsResponseInner {
    achievements: Vec<SteamGameAchievement>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
struct GetGameAchievementsResponse {
    playerstats: GetGameAchievementsResponseInner,
}

fn make_get_game_achievements_url(appid: u32, config: &Config) -> String {
    format!(
        "{}&key={}&steamid={}&appid={}",
        ACHEIVEMENTS_URL,
        config.steam().api_key(),
        config.steam().steam_id(),
        appid
    )
}

async fn load_acheivments_for_game_response(
    mut game: SteamGame,
    config: Config,
) -> Result<SteamGame> {
    match get_json::<GetGameAchievementsResponse>(&make_get_game_achievements_url(
        game.appid, &config,
    ))
    .await
    {
        Ok(response) => {
            game.achievements = Some(response.playerstats.achievements);
        }
        Err(_) => {
            // Game has no achievements
        }
    }

    Ok(game)
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SteamAvaialableGameStats {
    achievements: Vec<SteamAcheivement>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SteamAvailableGameStatsResponse {
    #[serde(rename = "gameName")]
    game_name: String,
    game: SteamAvaialableGameStats,
}

async fn load_available_acheivments_for_game_response(
    appid: u32,
    config: Config,
) -> Result<SteamAvaialableGameStats> {
    let url = format!(
        "http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key={}&appid={}",
        config.steam().api_key(),
        appid
    );

    let response = get_json::<SteamAvailableGameStatsResponse>(&url).await?;

    Ok(response.game)
}

#[derive(Debug, Clone, Default)]
pub struct GamesRepo {
    steam_games: Arc<RwLock<HashMap<u32, SteamGame>>>,
    steam_game_achievements: Arc<RwLock<HashMap<String, SteamAcheivement>>>,
}

impl GamesRepo {
    pub fn new() -> Self {
        Self {
            steam_games: Arc::new(RwLock::new(HashMap::new())),
            steam_game_achievements: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub fn from_archive(archive: GameRepoArchive) -> Self {
        Self {
            steam_games: Arc::new(RwLock::new(archive.steam_games)),
            steam_game_achievements: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn reload(&self, config: &Config) -> Result<()> {
        let games = get_json::<GetGamesResponse>(&make_get_games_url(config)).await?;

        let mut games_with_achievements_taks = JoinSet::new();

        for game in games.response.games {
            let game_with_achievements = load_acheivments_for_game_response(game, config.clone());

            games_with_achievements_taks.spawn(game_with_achievements);
        }

        let mut steam_games = HashMap::new();

        while let Some(game) = games_with_achievements_taks.join_next().await {
            if let Ok(Ok(game)) = game {
                steam_games.insert(game.appid, game);
            } else {
                // TODO log
            }
        }

        let mut steam_games_ref = self.steam_games.write().await;

        *steam_games_ref = steam_games;

        let mut steam_game_achievements = HashMap::new();

        let mut games_with_achievements_taks = JoinSet::new();

        for appid in steam_games_ref.keys() {
            let game_with_achievements =
                load_available_acheivments_for_game_response(*appid, config.clone());

            games_with_achievements_taks.spawn(game_with_achievements);
        }

        while let Some(game) = games_with_achievements_taks.join_next().await {
            if let Ok(Ok(game)) = game {
                for achievement in game.achievements {
                    steam_game_achievements.insert(achievement.name.clone(), achievement);
                }
            } else {
                // TODO log
            }
        }

        let mut steam_game_achievements_ref = self.steam_game_achievements.write().await;

        *steam_game_achievements_ref = steam_game_achievements;

        Ok(())
    }

    pub async fn get_archived(&self) -> Result<GameRepoArchive> {
        let games = self.steam_games.read().await;

        Ok(GameRepoArchive {
            steam_games: games.clone(),
        })
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameRepoArchive {
    steam_games: HashMap<u32, SteamGame>,
}
