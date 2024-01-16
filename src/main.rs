#![allow(unused)]

use crate::prelude::*;

use app_state::AppState;
use axum::{
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use config::Config;
use error::Error;
use loaders::load_source_data;
use models::{source_data::SourceData, data::Data};
use prelude::Result;
use routes::router;
use serde::{de::DeserializeOwned, Deserialize, Serialize};

mod app_state;
mod config;
mod error;
mod loaders;
mod models;
mod prelude;
mod routes;

async fn load_config() -> Result<Config> {
    let contents = tokio::fs::read_to_string("./config.json")
        .await
        .map_err(Error::ReadConfigFile)?;

    Config::from_json(&contents)
}

async fn prepare_folders(config: &Config) -> Result<()> {
    // create folders
    tokio::fs::create_dir_all(config.cache_dir())
        .await
        .map_err(Error::MakeFolder)?;

    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    let config = load_config().await?;

    prepare_folders(&config).await?;

    let source_data = SourceData::default();

    let source_data = load_source_data(&config, source_data).await?;

    let data = Data::from_source_data(&source_data)?;

    let state = AppState::new(config, data);

    let app = router().with_state(state);

    // run our app with hyper, listening globally on port 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}

async fn get_json<T>(url: &str) -> Result<T>
where
    T: DeserializeOwned,
{
    let resp = reqwest::get(url).await.map_err(Error::HttpReqwest)?;
    let json = resp.json::<T>().await.map_err(Error::HttpReqwest)?;

    Ok(json)
}
