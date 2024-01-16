use serde::{Serialize, Deserialize};

use crate::prelude::Result;

use super::{status_lol::StatusLolPosts, source_data::SourceData, lego::LegoCollection};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Data {
    status_lol: StatusLolPosts,
    lego: LegoCollection,
}

impl Data {
    pub fn from_source_data(source_data: &SourceData) -> Result<Self> {
        Ok(Self {
            status_lol: source_data.status_lol().clone(),
            lego: source_data.lego().clone(),
        })
    }

    pub fn status_lol(&self) -> &StatusLolPosts {
        &self.status_lol
    }

    pub fn lego(&self) -> &LegoCollection {
        &self.lego
    }
}
