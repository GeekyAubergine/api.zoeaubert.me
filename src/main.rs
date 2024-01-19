#![allow(unused)]

use std::{sync::Arc, thread::sleep, time::Duration};

use crate::prelude::*;

use axum::{
    http::{
        header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE},
        HeaderValue, Method, StatusCode,
    },
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use error::Error;
use infrastructure::{app_state::AppState, cdn::Cdn, config::Config};
use prelude::Result;
use routes::router;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use tokio::{sync::RwLock, task};
use tower_http::cors::CorsLayer;

mod application;
mod domain;
mod error;
mod infrastructure;
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

    let mut state = AppState::new(config.clone());

    state.init().await;

    let cdn = Cdn::new(config.clone()).await;

    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::PATCH, Method::DELETE])
        .allow_credentials(true)
        .allow_headers([AUTHORIZATION, ACCEPT, CONTENT_TYPE]);

    let app = router().with_state(state).layer(cors);

    // match cdn
    //     .file_exists(CndPath::new(
    //         "2024/01/14/d7e4347cfe88a444a5ee957cff044ba0.jpeg".to_owned(),
    //     ))
    //     .await
    // {
    //     Ok(exists) => {
    //         println!("File exists: {}", exists);
    //     }
    //     Err(e) => {
    //         println!("Failed to check file: {}", e);
    //     }
    // }

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
