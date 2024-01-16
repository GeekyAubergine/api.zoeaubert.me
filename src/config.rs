use crate::{error::Error, prelude::*};

use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct ConfigMastodon {
    #[serde(rename = "accountId")]
    account_id: String,
    #[serde(rename = "clientKey")]
    client_key: String,
    #[serde(rename = "clientSecret")]
    client_secret: String,
    #[serde(rename = "accessToken")]
    access_token: String,
}

impl ConfigMastodon {
    pub fn account_id(&self) -> &str {
        &self.account_id
    }

    pub fn client_key(&self) -> &str {
        &self.client_key
    }

    pub fn client_secret(&self) -> &str {
        &self.client_secret
    }

    pub fn access_token(&self) -> &str {
        &self.access_token
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct ConfigStatusLol {
    url: String,
}

impl ConfigStatusLol {
    pub fn url(&self) -> &str {
        &self.url
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    #[serde(rename = "cacheDir")]
    cache_dir: String,
    mastodon: ConfigMastodon,
    #[serde(rename = "statusLol")]
    status_lol: ConfigStatusLol,
}

impl Config {
    pub fn from_json(json: &str) -> Result<Self> {
        serde_json::from_str(json).map_err(Error::ParseConfigFile)
    }

    pub fn cache_dir(&self) -> &str {
        &self.cache_dir
    }

    pub fn mastodon(&self) -> &ConfigMastodon {
        &self.mastodon
    }

    pub fn status_lol(&self) -> &ConfigStatusLol {
        &self.status_lol
    }
}
