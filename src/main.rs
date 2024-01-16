#![allow(unused)]

use std::{sync::Arc, thread::sleep, time::Duration};

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
use models::{data::Data, source_data::SourceData};
use prelude::Result;
use routes::router;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use tokio::{sync::RwLock, task};

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

    let data = Arc::new(RwLock::new(Data::default()));

    let mut state = AppState::new(config.clone(), data.clone());

    let app = router().with_state(state);

    // run our app with hyper, listening globally on port 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    task::spawn(async move {
        match load_source_data(&config, SourceData::default()).await {
            Ok(source_data) => {
                let mut data = data.write().await;

                match Data::from_source_data(&source_data) {
                    Ok(next_data) => {
                        *data = next_data;
                    }
                    Err(e) => {
                        println!("Failed to load source data: {}", e);
                    }
                }
            }
            Err(e) => {
                println!("Failed to load source data: {}", e);
            }
        }
    });

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
