use crate::application::events::Event;
use crate::infrastructure::app_state::AppState;
use crate::infrastructure::bus::BusJob;
use crate::prelude::*;

#[derive(Debug)]
pub struct LoadAllDataFromArchiveJob;

impl BusJob for LoadAllDataFromArchiveJob {
    async fn run(&self, app_state: &AppState) -> Result<()> {
        app_state.dispatch_event(Event::LoadedFromArchive).await?;

        Ok(())
    }
}
