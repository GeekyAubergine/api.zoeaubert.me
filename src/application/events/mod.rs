use crate::infrastructure::bus::BusEvent;

#[derive(Debug)]
pub enum Event {
    LoadedFromArchive,
    LegoRepoUpdated,
    GamesRepoUpdated,
    StatusLolRepoUpdated,
    AboutRepoUpdated,
    FaqRepoUpdated,
}

impl BusEvent for Event {
    fn name(&self) -> &'static str {
        match self {
            Event::LoadedFromArchive => "loaded_from_archive",
            Event::LegoRepoUpdated => "lego_repo.updated",
            Event::GamesRepoUpdated => "games_repo.updated",
            Event::StatusLolRepoUpdated => "status_lol_repo.updated",
            Event::AboutRepoUpdated => "about_repo.updated",
            Event::FaqRepoUpdated => "faq_repo.updated",
        }
    }
}

impl Event {
    pub fn loaded_from_archive() -> Self {
        Self::LoadedFromArchive
    }

    pub fn lego_repo_updated() -> Self {
        Self::LegoRepoUpdated
    }

    pub fn games_repo_updated() -> Self {
        Self::GamesRepoUpdated
    }

    pub fn status_lol_repo_updated() -> Self {
        Self::StatusLolRepoUpdated
    }

    pub fn about_repo_updated() -> Self {
        Self::AboutRepoUpdated
    }

    pub fn faq_repo_updated() -> Self {
        Self::FaqRepoUpdated
    }
}
