use crate::{config::Config, prelude::*, get_json};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::models::status_lol::StatusLolPost;

#[derive(Debug, Clone, Deserialize)]
pub struct ApiStatusLolPost {
    id: String,
    address: String,
    created: String,
    relative_time: String,
    emoji: String,
    content: String,
    external_url: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ApiStatusLolResponseValue {
    message: String,
    statuses: Vec<ApiStatusLolPost>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct StatusLolRequestValue {
    status_code: u16,
    success: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct StatusLolResponse {
    request: StatusLolRequestValue,
    response: ApiStatusLolResponseValue,
}

impl From<ApiStatusLolPost> for StatusLolPost {
    fn from(post: ApiStatusLolPost) -> Self {
        let key = format!("statuslol-{}", post.id);
        let permalink = format!("/micros/statuslol-{}", post.id);
        let original_url = format!("https://{}.status.lol/{}", post.address, post.id);

        let date = match post.created.parse::<i64>() {
            Ok(date) => match DateTime::from_timestamp(date, 0) {
                Some(date) => date,
                None => Utc::now(),
            },
            Err(_) => Utc::now(),
        };

        StatusLolPost::new(key, permalink, date, post.content, post.emoji, original_url)
    }
}

pub async fn load_status_lol_posts(config: &Config) -> Result<Vec<StatusLolPost>> {
    let response = get_json::<StatusLolResponse>(config.status_lol().url()).await?;

    let posts = response
        .response
        .statuses
        .into_iter()
        .map(|post| post.into())
        .collect::<Vec<StatusLolPost>>();

    Ok(posts)
}
