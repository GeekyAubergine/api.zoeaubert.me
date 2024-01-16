use crate::models::status_lol;
use crate::prelude::*;

use crate::{models::source_data::SourceData, config::Config};

use self::status_lol_loader::load_status_lol_posts;

pub mod status_lol_loader;

pub async fn load_source_data(config: &Config, mut source_data: SourceData) -> Result<SourceData> {
    match load_status_lol_posts(config).await {
        Ok(status_lol_posts) => {
            source_data.status_lol_mut().add_posts(status_lol_posts);
        }
        Err(e) => {
            println!("Failed to load status_lol_posts: {}", e);
        }
    }

    Ok(source_data)
}