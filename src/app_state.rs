use std::sync::{Arc};

use tokio::sync::RwLock;

use crate::{prelude::*, config::Config, models::data::Data};

#[derive(Debug, Clone)]
pub struct AppState {
    config: Config,
    data: Arc<RwLock<Data>>,
}

impl AppState {
    pub fn new(config: Config, data: Arc<RwLock<Data>>) -> Self {
        Self {
            config,
            data,
        }
    }

    pub fn config(&self) -> &Config {
        &self.config
    }

    pub fn data(&self) -> Arc<RwLock<Data>> {
        self.data.clone()
    }
}