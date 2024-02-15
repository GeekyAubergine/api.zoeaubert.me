use std::sync::Arc;

use chrono::{DateTime, Utc};
use serde::Deserialize;
use tokio::sync::RwLock;

use crate::{
    domain::models::status_lol::StatusLolPost, get_json, infrastructure::config::Config, prelude::*,
};

#[derive(Debug, Clone, Deserialize)]
pub struct ReponseStatusLolPost {
    id: String,
    address: String,
    created: String,
    relative_time: String,
    emoji: String,
    content: String,
    external_url: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ResponseStatusLolResponseValue {
    message: String,
    statuses: Vec<ReponseStatusLolPost>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ResponseStatusLolRequestValue {
    status_code: u16,
    success: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct StatusLolResponse {
    request: ResponseStatusLolRequestValue,
    response: ResponseStatusLolResponseValue,
}

impl From<ReponseStatusLolPost> for StatusLolPost {
    fn from(post: ReponseStatusLolPost) -> Self {
        let key = format!("statuslol-{}", post.id);
        let permalink = format!("/micros/statuslol-{}", post.id);
        let original_url = format!("https://{}.status.lol/{}", post.address, post.id);

        let date = match post.created.parse::<i64>() {
            Ok(date) => match DateTime::from_timestamp(date * 1000, 0) {
                Some(date) => date,
                None => Utc::now(),
            },
            Err(_) => Utc::now(),
        };

        StatusLolPost::new(key, permalink, date, post.content, post.emoji, original_url)
    }
}

#[derive(Debug, Clone, Default)]
pub struct StatusLolRepo {
    posts: Arc<RwLock<Vec<ReponseStatusLolPost>>>,
}

impl StatusLolRepo {
    pub fn new() -> Self {
        Self {
            posts: Arc::new(RwLock::new(Vec::new())),
        }
    }

    pub async fn reload(&self, config: &Config) -> Result<()> {
        let response = get_json::<StatusLolResponse>(config.status_lol().url()).await?;

        let posts = response.response.statuses;

        let mut posts = self.posts.write().await;
        *posts = posts.clone();

        Ok(())
    }

    pub async fn get_status_lol_posts(&self) -> Result<Vec<StatusLolPost>> {
        let posts = self.posts.read().await;
        Ok(posts
            .iter()
            .map(|post| post.clone().into())
            .collect::<Vec<StatusLolPost>>())
    }
}
