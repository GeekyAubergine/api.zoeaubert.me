use axum::{Router, Json, http::StatusCode, routing::post, response::IntoResponse};
use serde::{Serialize, Deserialize};

use crate::infrastructure::app_state::AppState;

pub mod api;

pub fn router() -> Router<AppState> {
    Router::new()
        .nest("/", api::api_routes())
        .route("/users", post(create_user))
        .fallback(handler_404)
}

async fn handler_404() -> impl IntoResponse {
    (
        StatusCode::NOT_FOUND,
        "The requested resource was not found",
    )
}

async fn create_user(
    // this argument tells axum to parse the request body
    // as JSON into a `CreateUser` type
    Json(payload): Json<CreateUser>,
) -> (StatusCode, Json<User>) {
    // insert your application logic here
    let user = User {
        id: 1337,
        username: payload.username,
    };

    // this will be converted into a JSON response
    // with a status code of `201 Created`
    (StatusCode::CREATED, Json(user))
}

// the input to our `create_user` handler
#[derive(Deserialize)]
struct CreateUser {
    username: String,
}

// the output to our `create_user` handler
#[derive(Serialize)]
struct User {
    id: u64,
    username: String,
}