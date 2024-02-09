#![allow(unused)]

use std::{sync::Arc, thread::sleep, time::Duration};

use crate::prelude::*;

use application::{events::Event, jobs::Job};
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
use infrastructure::{
    app_state::{AppState, AppStateData},
    bus::Queue,
    cdn::Cdn,
    config::Config,
};
use prelude::Result;
use routes::router;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use tokio::{
    sync::{mpsc::channel, RwLock},
    task,
};
use tower_http::{cors::CorsLayer, services::ServeDir};

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
    tokio::fs::create_dir_all(config.cache_dir())
        .await
        .map_err(Error::MakeFolder)?;

    tokio::fs::create_dir_all(config.archive_dir())
        .await
        .map_err(Error::MakeFolder)?;

    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    let config = load_config().await?;

    prepare_folders(&config).await?;

    let (job_sender, queue_receiver) = channel::<Job>(1000);
    let (event_sender, event_receiver) = channel::<Event>(1000);

    let state = AppStateData::new(&config, job_sender.clone(), event_sender.clone()).await;

    let state = Arc::new(state);

    let mut queue = Queue::<Job, Event>::new(state.clone(), queue_receiver, event_receiver);

    println!("Starting jobs...");
    state.dispatch_job(Job::reload_all_data()).await?;

    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::PATCH, Method::DELETE])
        .allow_credentials(true)
        .allow_headers([AUTHORIZATION, ACCEPT, CONTENT_TYPE]);

    let static_files = ServeDir::new("./assets");

    let app = router()
        .with_state(state)
        .nest_service("/", static_files)
        .layer(cors);

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

    task::spawn(async move {
        sleep(Duration::from_secs(1));

        queue.start().await;
    });

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
