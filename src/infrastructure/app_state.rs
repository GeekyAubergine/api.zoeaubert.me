use std::sync::Arc;

use tokio::sync::{mpsc::Sender, RwLock};

use crate::{
    application::{jobs::Job, events::Event},
    error::Error,
    infrastructure::{
        config::Config,
        repositories::{
            games_repo::GamesRepo, lego_repo::LegoRepo, status_lol_repo::StatusLolRepo,
        },
    },
    prelude::*,
};

use super::{
    cdn::Cdn,
    repositories::{about_repo::AboutRepo, faq_repo::FaqRepo},
};

#[derive(Debug, Clone)]
pub struct AppStateData {
    config: Config,
    cdn: Cdn,
    games_repo: GamesRepo,
    lego_repo: LegoRepo,
    status_lol_repo: StatusLolRepo,
    about_repo: AboutRepo,
    faq_repo: FaqRepo,
    job_sender: Sender<Job>,
    event_sender: Sender<Event>
}

impl AppStateData {
    pub async fn new(config: &Config, job_sender: Sender<Job>, event_sender: Sender<Event>) -> Self {
        Self {
            config: config.clone(),
            cdn: Cdn::new(config).await,
            games_repo: GamesRepo::new(),
            lego_repo: LegoRepo::new(),
            status_lol_repo: StatusLolRepo::new(),
            about_repo: AboutRepo::new(),
            faq_repo: FaqRepo::new(),
            job_sender,
            event_sender
        }
    }

    pub async fn dispatch_job(&self, job: Job) -> Result<()> {
        self.job_sender
            .send(job)
            .await
            .map_err(Error::DispatchJob)
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

    pub fn about_repo(&self) -> &AboutRepo {
        &self.about_repo
    }

    pub fn faq_repo(&self) -> &FaqRepo {
        &self.faq_repo
    }
}

pub type AppState = Arc<AppStateData>;
