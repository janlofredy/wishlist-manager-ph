use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{delete, get, post, put},
    Router,
};
use std::sync::Arc;
use crate::models::wishlist::{CreateWishlistRequest, UpdateWishlistRequest, Wishlist};
use crate::routes::auth_middleware::AuthUser;
use crate::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_wishlists).post(create_wishlist))
        .route("/:id", get(get_wishlist).put(update_wishlist).delete(delete_wishlist))
}

async fn list_wishlists(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<Json<Vec<Wishlist>>, (StatusCode, String)> {
    let list = sqlx::query_as!(
        Wishlist,
        "SELECT id, user_id, name, description, monthly_budget, carryover_budget, created_at, updated_at FROM wishlists WHERE user_id = ? ORDER BY created_at ASC",
        claims.sub
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(list))
}

async fn create_wishlist(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Json(payload): Json<CreateWishlistRequest>,
) -> Result<Json<Wishlist>, (StatusCode, String)> {
    let id = uuid::Uuid::new_v4().to_string();
    let monthly_budget = payload.monthly_budget.unwrap_or(3000.0);

    sqlx::query!(
        "INSERT INTO wishlists (id, user_id, name, description, monthly_budget, carryover_budget) VALUES (?, ?, ?, ?, ?, 0.0)",
        id,
        claims.sub,
        payload.name,
        payload.description,
        monthly_budget
    )
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let created = sqlx::query_as!(
        Wishlist,
        "SELECT id, user_id, name, description, monthly_budget, carryover_budget, created_at, updated_at FROM wishlists WHERE id = ?",
        id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(created))
}

async fn get_wishlist(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(id): Path<String>,
) -> Result<Json<Wishlist>, (StatusCode, String)> {
    let w = sqlx::query_as!(
        Wishlist,
        "SELECT id, user_id, name, description, monthly_budget, carryover_budget, created_at, updated_at FROM wishlists WHERE id = ? AND user_id = ?",
        id,
        claims.sub
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or_else(|| (StatusCode::NOT_FOUND, "Wishlist not found".to_string()))?;

    Ok(Json(w))
}

async fn update_wishlist(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(id): Path<String>,
    Json(payload): Json<UpdateWishlistRequest>,
) -> Result<Json<Wishlist>, (StatusCode, String)> {
    let current = sqlx::query_as!(
        Wishlist,
        "SELECT id, user_id, name, description, monthly_budget, carryover_budget, created_at, updated_at FROM wishlists WHERE id = ? AND user_id = ?",
        id,
        claims.sub
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or_else(|| (StatusCode::NOT_FOUND, "Wishlist not found".to_string()))?;

    let name = payload.name.unwrap_or(current.name);
    let desc = payload.description.or(current.description);
    let budget = payload.monthly_budget.unwrap_or(current.monthly_budget);
    let carryover = payload.carryover_budget.unwrap_or(current.carryover_budget);

    sqlx::query!(
        "UPDATE wishlists SET name = ?, description = ?, monthly_budget = ?, carryover_budget = ?, updated_at = datetime('now') WHERE id = ?",
        name,
        desc,
        budget,
        carryover,
        id
    )
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let updated = sqlx::query_as!(
        Wishlist,
        "SELECT id, user_id, name, description, monthly_budget, carryover_budget, created_at, updated_at FROM wishlists WHERE id = ?",
        id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(updated))
}

async fn delete_wishlist(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(id): Path<String>,
) -> Result<StatusCode, (StatusCode, String)> {
    let res = sqlx::query!(
        "DELETE FROM wishlists WHERE id = ? AND user_id = ?",
        id,
        claims.sub
    )
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if res.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Wishlist not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
