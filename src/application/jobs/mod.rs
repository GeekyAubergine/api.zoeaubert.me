use crate::{
    infrastructure::{app_state::AppState, bus::BusJob},
    prelude::Result,
};

use self::load_all_data_from_archive_job::LoadAllDataFromArchiveJob;

use super::events::Event;

pub mod load_all_data_from_archive_job;

#[derive(Debug)]
pub struct ReloadAllDataJob;

impl BusJob for ReloadAllDataJob {
    async fn run(&self, app_state: &AppState) -> Result<()> {
        println!("Reloading all data...");
        app_state.dispatch_job(Job::reload_lego_data()).await?;
        app_state.dispatch_job(Job::reload_games_data()).await?;
        app_state
            .dispatch_job(Job::reload_status_lol_data())
            .await?;
        app_state.dispatch_job(Job::reload_about_data()).await?;
        app_state.dispatch_job(Job::reload_faq_data()).await?;

        Ok(())
    }
}

#[derive(Debug)]
pub struct RealoadLegoDataJob;

impl BusJob for RealoadLegoDataJob {
    async fn run(&self, app_state: &AppState) -> Result<()> {
        app_state.lego_repo().reload(app_state.config()).await?;

        app_state.dispatch_event(Event::lego_repo_updated()).await?;

        Ok(())
    }
}

#[derive(Debug)]
pub struct ReloadGamesDataJob;

impl BusJob for ReloadGamesDataJob {
    async fn run(&self, app_state: &AppState) -> Result<()> {
        app_state.games_repo().reload(app_state.config()).await?;

        app_state
            .dispatch_event(Event::games_repo_updated())
            .await?;

        Ok(())
    }
}

#[derive(Debug)]
pub struct ReloadStatusLolDataJob;

impl BusJob for ReloadStatusLolDataJob {
    async fn run(&self, app_state: &AppState) -> Result<()> {
        app_state
            .status_lol_repo()
            .reload(app_state.config())
            .await?;

        app_state
            .dispatch_event(Event::status_lol_repo_updated())
            .await?;

        Ok(())
    }
}

#[derive(Debug)]
pub struct ReloadAboutDataJob;

impl BusJob for ReloadAboutDataJob {
    async fn run(&self, app_state: &AppState) -> Result<()> {
        app_state
            .about_repo()
            .reload(app_state.config(), app_state.cache())
            .await?;

        app_state
            .dispatch_event(Event::about_repo_updated())
            .await?;

        Ok(())
    }
}

#[derive(Debug)]
pub struct ReloadFaqDataJob;

impl BusJob for ReloadFaqDataJob {
    async fn run(&self, app_state: &AppState) -> Result<()> {
        app_state
            .faq_repo()
            .reload(app_state.config(), app_state.cache())
            .await?;

        app_state.dispatch_event(Event::faq_repo_updated()).await?;

        Ok(())
    }
}

#[derive(Debug)]
pub enum Job {
    LoadAllDataFromArchive(LoadAllDataFromArchiveJob),
    ReloadAllData(ReloadAllDataJob),
    ReloadLegoData(RealoadLegoDataJob),
    ReloadGamesData(ReloadGamesDataJob),
    ReloadStatusLolData(ReloadStatusLolDataJob),
    ReloadAboutData(ReloadAboutDataJob),
    ReloadFaqData(ReloadFaqDataJob),
}

impl BusJob for Job {
    async fn run(&self, app_state: &AppState) -> Result<()> {
        match self {
            Self::LoadAllDataFromArchive(job) => job.run(app_state).await,
            Self::ReloadAllData(job) => job.run(app_state).await,
            Self::ReloadLegoData(job) => job.run(app_state).await,
            Self::ReloadGamesData(job) => job.run(app_state).await,
            Self::ReloadStatusLolData(job) => job.run(app_state).await,
            Self::ReloadAboutData(job) => job.run(app_state).await,
            Self::ReloadFaqData(job) => job.run(app_state).await,
        }
    }
}

impl Job {
    pub fn load_all_data_from_archive() -> Self {
        Self::LoadAllDataFromArchive(LoadAllDataFromArchiveJob)
    }

    pub fn reload_all_data() -> Self {
        Self::ReloadAllData(ReloadAllDataJob)
    }

    pub fn reload_lego_data() -> Self {
        Self::ReloadLegoData(RealoadLegoDataJob)
    }

    pub fn reload_games_data() -> Self {
        Self::ReloadGamesData(ReloadGamesDataJob)
    }

    pub fn reload_status_lol_data() -> Self {
        Self::ReloadStatusLolData(ReloadStatusLolDataJob)
    }

    pub fn reload_about_data() -> Self {
        Self::ReloadAboutData(ReloadAboutDataJob)
    }

    pub fn reload_faq_data() -> Self {
        Self::ReloadFaqData(ReloadFaqDataJob)
    }
}
