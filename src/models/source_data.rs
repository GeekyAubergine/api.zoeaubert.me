use serde::{Serialize, Deserialize};

use super::{status_lol::StatusLolPosts, lego::LegoCollection};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SourceData {
    status_lol: StatusLolPosts,
    lego: LegoCollection,
}

impl SourceData {
    pub fn status_lol(&self) -> &StatusLolPosts {
        &self.status_lol
    }

    pub fn status_lol_mut(&mut self) -> &mut StatusLolPosts {
        &mut self.status_lol
    }

    pub fn lego(&self) -> &LegoCollection {
        &self.lego
    }

    pub fn set_lego(&mut self, lego: LegoCollection) {
        self.lego = lego;
    }
}
