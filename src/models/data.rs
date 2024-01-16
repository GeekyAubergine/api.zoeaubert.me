use serde::{Serialize, Deserialize};

use crate::prelude::Result;

use super::{status_lol::StatusLolPosts, source_data::SourceData};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Data {
    status_lol: StatusLolPosts,
}

impl Data {
    pub fn from_source_data(source_data: &SourceData) -> Result<Self> {
        Ok(Self {
            status_lol: source_data.status_lol().clone(),
        })
    }
}
