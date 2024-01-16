use serde::{Serialize, Deserialize};

use super::status_lol::StatusLolPosts;

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SourceData {
    status_lol: StatusLolPosts,
}

impl SourceData {
    pub fn status_lol(&self) -> &StatusLolPosts {
        &self.status_lol
    }

    pub fn status_lol_mut(&mut self) -> &mut StatusLolPosts {
        &mut self.status_lol
    }
}
