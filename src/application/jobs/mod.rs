use crate::{infrastructure::{app_state::AppState, bus::BusJob}, prelude::Result};

pub enum Job {
    ReloadAllDataJob,
}

impl BusJob for Job {
    async fn run(&self, app_state: &AppState) -> Result<()> {
        Ok(())
    }
}
