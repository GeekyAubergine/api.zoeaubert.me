use std::{sync::Arc, collections::HashMap};

use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

use crate::{
    domain::models::lego::{LegoMinifig, LegoSet},
    infrastructure::config::Config,
    prelude::*, get_json,
};

const LOGIN_URL: &str = "https://brickset.com/api/v3.asmx/login";
const GET_SET_URL: &str = "https://brickset.com/api/v3.asmx/getSets";
const GET_MINIFIG_URL: &str = "https://brickset.com/api/v3.asmx/getMinifigCollection";

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct BricksetLoginResponse {
    hash: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct BricksetSetImages {
    #[serde(rename = "imageURL")]
    image_url: String,
    #[serde(rename = "thumbnailURL")]
    thumbnail_url: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct BricksetSetCollection {
    #[serde(rename = "qtyOwned")]
    qty_owned: u32,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct BricksetSet {
    #[serde(rename = "setID")]
    set_id: u32,
    name: String,
    number: String,
    category: String,
    pieces: Option<u32>,
    image: BricksetSetImages,
    #[serde(rename = "bricksetURL")]
    brickset_url: String,
    collection: BricksetSetCollection,
}

impl From<BricksetSet> for LegoSet {
    fn from(set: BricksetSet) -> Self {
        LegoSet::new(
            set.set_id,
            set.name,
            set.number,
            set.category,
            set.pieces.unwrap_or(1),
            set.image.image_url,
            set.image.thumbnail_url,
            set.brickset_url,
            set.collection.qty_owned,
        )
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetSetResponse {
    status: String,
    sets: Vec<BricksetSet>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct BricksetMinifig {
    #[serde(rename = "minifigNumber")]
    minifig_number: String,
    name: String,
    category: String,
    #[serde(rename = "ownedInSets")]
    owned_in_sets: u32,
    #[serde(rename = "ownedLoose")]
    owned_loose: u32,
}

impl From<BricksetMinifig> for LegoMinifig {
    fn from(set: BricksetMinifig) -> Self {
        LegoMinifig::new(
            set.minifig_number.clone(),
            set.name,
            set.category,
            set.owned_in_sets,
            set.owned_loose,
            set.owned_in_sets + set.owned_loose,
            format!(
                "https://img.bricklink.com/ItemImage/MN/0/{}.png",
                set.minifig_number
            ),
        )
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GetMinifigsResponse {
    status: String,
    minifigs: Vec<BricksetMinifig>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct BricksetData {
    sets: Vec<BricksetSet>,
    minifigs: Vec<BricksetMinifig>,
}

fn make_login_url(config: &Config) -> String {
    format!(
        "{}?apiKey={}&username={}&password={}",
        LOGIN_URL,
        config.brickset().api_key(),
        config.brickset().username(),
        config.brickset().password()
    )
}

fn make_get_set_url(config: &Config, hash: &str) -> String {
    format!(
        "{}?apiKey={}&userHash={}&params={{\"owned\":1, \"pageSize\": 500}}",
        GET_SET_URL,
        config.brickset().api_key(),
        hash,
    )
}

fn make_get_minifig_url(config: &Config, hash: &str) -> String {
    format!(
        "{}?apiKey={}&userHash={}&params={{\"owned\":1, \"pageSize\": 500}}",
        GET_MINIFIG_URL,
        config.brickset().api_key(),
        hash,
    )
}

#[derive(Debug, Clone)]
pub struct LegoRepo {
    brickset: Arc<RwLock<BricksetData>>,
}

impl LegoRepo {
    pub fn new() -> Self {
        Self {
            brickset: Arc::new(RwLock::new(BricksetData::default())),
        }
    }

    pub fn from_archive(archive: LegoRepoArchive) -> Self {
        Self {
            brickset: Arc::new(RwLock::new(archive.brickset)),
        }
    }

    pub async fn reload(&self, config: &Config) -> Result<()> {
        let login_response = get_json::<BricksetLoginResponse>(&make_login_url(config)).await?;

        let get_set_url = make_get_set_url(config, &login_response.hash);

        let get_set_response = get_json::<GetSetResponse>(&get_set_url).await?;

        let mut brickset_data = BricksetData::default();

        if get_set_response.status == "success" {
            brickset_data.sets = get_set_response.sets.clone();
        }

        let get_minifig_url = make_get_minifig_url(config, &login_response.hash);

        let get_minifig_response = get_json::<GetMinifigsResponse>(&get_minifig_url).await?;

        if get_minifig_response.status == "success" {
            brickset_data.minifigs = get_minifig_response.minifigs.clone();
        }

        let mut brickset_ref = self.brickset.write().await;

        *brickset_ref = brickset_data;

        Ok(())
    }

    pub async fn get_archived(&self) -> Result<LegoRepoArchive> {
        let brickset = self.brickset.read().await;

        Ok(LegoRepoArchive {
            brickset: brickset.clone(),
        })
    }

    pub async fn get_all_sets(&self) -> HashMap<u32, LegoSet> {
        let brickset = self.brickset.read().await;

        brickset
            .sets
            .iter()
            .map(|set| (set.set_id, set.clone().into()))
            .collect()
    }

    pub async fn get_all_minifigs(&self) -> HashMap<String, LegoMinifig> {
        let brickset = self.brickset.read().await;

        brickset
            .minifigs
            .iter()
            .map(|minifig| (minifig.minifig_number.clone(), minifig.clone().into()))
            .collect()
    }

    pub async fn get_most_piece_sets(&self) -> Vec<u32> {
        let brickset = self.brickset.read().await;

        let mut sets = brickset.sets.iter().collect::<Vec<&BricksetSet>>();

        sets.sort_by_key(|a| a.pieces.unwrap_or(1));

        sets.iter().map(|set| set.set_id).rev().collect()
    }

    pub async fn get_most_owned_minifigs(&self) -> Vec<String> {
        let brickset = self.brickset.read().await;

        let mut minifigs = brickset.minifigs.iter().collect::<Vec<&BricksetMinifig>>();

        minifigs.sort_by_key(|a| a.owned_in_sets + a.owned_loose);

        minifigs
            .iter()
            .map(|minifig| minifig.minifig_number.clone())
            .rev()
            .collect()
    }

    pub async fn get_total_pieces(&self) -> u32 {
        let brickset = self.brickset.read().await;

        brickset.sets.iter().map(|set| set.pieces.unwrap_or(1)).sum()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LegoRepoArchive {
    brickset: BricksetData,
}