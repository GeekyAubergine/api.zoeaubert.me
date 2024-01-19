use std::sync::Arc;

use tokio::sync::RwLock;

use crate::{
    infrastructure::{
        config::Config,
        repositories::{
            games_repo::GamesRepo, lego_repo::LegoRepo, status_lol_repo::StatusLolRepo,
        },
    },
    prelude::*,
};

#[derive(Debug, Clone)]
pub struct AppState {
    config: Config,
    games_repo: GamesRepo,
    lego_repo: LegoRepo,
    status_lol_repo: StatusLolRepo,
}

impl AppState {
    pub fn new(config: Config) -> Self {
        Self {
            config,
            games_repo: GamesRepo::new(),
            lego_repo: LegoRepo::new(),
            status_lol_repo: StatusLolRepo::new(),
        }
    }

    pub async fn init(&mut self) -> Result<()> {
        self.games_repo.reload(&self.config).await?;
        self.lego_repo.reload(&self.config).await?;
        self.status_lol_repo.reload(&self.config).await?;

        Ok(())
    }

    pub fn config(&self) -> &Config {
        &self.config
    }

    pub fn games_repo(&self) -> &GamesRepo {
        &self.games_repo
    }

    pub fn lego_repo(&self) -> &LegoRepo {
        &self.lego_repo
    }

    pub fn status_lol_repo(&self) -> &StatusLolRepo {
        &self.status_lol_repo
    }
}
