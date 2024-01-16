use serde::Deserialize;

use crate::{
    config::Config,
    get_json,
    models::lego::{LegoCollection, LegoSet, LegoMinifig},
    prelude::*,
};

const LOGIN_URL: &str = "https://brickset.com/api/v3.asmx/login";
const GET_SET_URL: &str = "https://brickset.com/api/v3.asmx/getSets";
const GET_MINIFIG_URL: &str = "https://brickset.com/api/v3.asmx/getMinifigCollection";

#[derive(Debug, Clone, Default, Deserialize)]
pub struct LoginResponse {
    hash: String,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct GetSetResponseSetImage {
    #[serde(rename = "imageURL")]
    image_url: String,
    #[serde(rename = "thumbnailURL")]
    thumbnail_url: String,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct GetSetResponseCollection {
    #[serde(rename = "qtyOwned")]
    qty_owned: u32,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct GetSetResponseSet {
    #[serde(rename = "setID")]
    set_id: u32,
    name: String,
    number: String,
    category: String,
    pieces: Option<u32>,
    image: GetSetResponseSetImage,
    #[serde(rename = "bricksetURL")]
    brickset_url: String,
    collection: GetSetResponseCollection,
}

impl From<GetSetResponseSet> for LegoSet {
    fn from(set: GetSetResponseSet) -> Self {
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

#[derive(Debug, Clone, Default, Deserialize)]
pub struct GetSetResponse {
    status: String,
    sets: Vec<GetSetResponseSet>,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct GetMinifigsResponseSet {
    #[serde(rename = "minifigNumber")]
    minifig_number: String,
    name: String,
    category: String,
    #[serde(rename = "ownedInSets")]
    owned_in_sets: u32,
    #[serde(rename = "ownedLoose")]
    owned_loose: u32,
}

impl From<GetMinifigsResponseSet> for LegoMinifig {
    fn from(set: GetMinifigsResponseSet) -> Self {
        LegoMinifig::new(
            set.minifig_number,
            set.name,
            set.category,
            set.owned_in_sets,
            set.owned_loose,
        )
    }
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct GetMinifigsResponse {
    status: String,
    minifigs: Vec<GetMinifigsResponseSet>,
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

pub async fn load_lego(config: &Config) -> Result<LegoCollection> {
    let login_response = get_json::<LoginResponse>(&make_login_url(config)).await?;

    let get_set_url = make_get_set_url(config, &login_response.hash);

    let get_set_response = get_json::<GetSetResponse>(&get_set_url).await?;

    let mut collection = LegoCollection::new();

    if get_set_response.status == "success" {
        collection.add_sets(
            get_set_response
                .sets
                .into_iter()
                .map(|set| set.into())
                .collect(),
        );
    }

    let get_minifig_url = make_get_minifig_url(config, &login_response.hash);

    let get_minifig_response = get_json::<GetMinifigsResponse>(&get_minifig_url).await?;

    if get_minifig_response.status == "success" {
        collection.add_minifigs(
            get_minifig_response
                .minifigs
                .into_iter()
                .map(|minifig| minifig.into())
                .collect(),
        );
    }

    Ok(collection)
}
