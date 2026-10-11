use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{delete, get, post, put},
    Router,
};
use serde::Deserialize;
use std::sync::Arc;
use crate::models::item::{CreateItemRequest, ItemPriceStats, PriceHistory, UpdateItemRequest, WishlistItem};
use crate::routes::auth_middleware::AuthUser;
use crate::services::shopee_tracker::refresh_item_price;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct ItemQuery {
    pub wishlist_id: Option<String>,
    pub status: Option<String>,
    pub classification: Option<String>,
    pub category: Option<String>,
    pub search: Option<String>,
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_items).post(create_item))
        .route("/:id", get(get_item).put(update_item).delete(delete_item))
        .route("/:id/purchase", post(mark_purchased))
        .route("/:id/restore", post(restore_purchased))
        .route("/:id/refresh-price", post(manual_refresh_price))
        .route("/:id/price-history", get(get_price_history))
        .route("/:id/price-stats", get(get_price_stats))
}

async fn list_items(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Query(query): Query<ItemQuery>,
) -> Result<Json<Vec<WishlistItem>>, (StatusCode, String)> {
    let mut sql = "SELECT id, wishlist_id, user_id, name, category, classification, priority, estimated_price, current_price, target_price, quantity, status, notes, shopee_url, shopee_item_id, shopee_shop_id, preferred_seller, preferred_shop, voucher_discount, has_free_shipping, rating, units_sold, is_in_stock, created_date, last_updated, purchased_date FROM items WHERE user_id = ?".to_string();

    if let Some(w_id) = &query.wishlist_id {
        sql.push_str(&format!(" AND wishlist_id = '{}'", w_id));
    }
    if let Some(status) = &query.status {
        sql.push_str(&format!(" AND status = '{}'", status));
    }
    if let Some(class) = &query.classification {
        sql.push_str(&format!(" AND classification = '{}'", class));
    }
    if let Some(cat) = &query.category {
        sql.push_str(&format!(" AND category = '{}'", cat));
    }
    if let Some(s) = &query.search {
        sql.push_str(&format!(" AND name LIKE '%{}%'", s.replace('\'', "''")));
    }

    sql.push_str(" ORDER BY priority ASC, created_date DESC");

    let items = sqlx::query_as::<_, WishlistItem>(&sql)
        .bind(claims.sub)
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(items))
}

async fn create_item(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Json(payload): Json<CreateItemRequest>,
) -> Result<Json<WishlistItem>, (StatusCode, String)> {
    let id = uuid::Uuid::new_v4().to_string();
    let classification = payload.classification.unwrap_or_else(|| "Want".to_string());
    let priority = payload.priority.unwrap_or(2);
    let current_price = payload.current_price.unwrap_or(payload.estimated_price);
    let target_price = payload.target_price.unwrap_or(payload.estimated_price * 0.85);
    let quantity = payload.quantity.unwrap_or(1);
    let status = payload.status.unwrap_or_else(|| "Waiting".to_string());

    sqlx::query!(
        r#"
        INSERT INTO items (
            id, wishlist_id, user_id, name, category, classification, priority,
            estimated_price, current_price, target_price, quantity, status, notes,
            shopee_url, preferred_seller, preferred_shop
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        id,
        payload.wishlist_id,
        claims.sub,
        payload.name,
        payload.category,
        classification,
        priority,
        payload.estimated_price,
        current_price,
        target_price,
        quantity,
        status,
        payload.notes,
        payload.shopee_url,
        payload.preferred_seller,
        payload.preferred_shop
    )
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Record initial price history
    let history_id = uuid::Uuid::new_v4().to_string();
    let _ = sqlx::query!(
        "INSERT INTO price_history (id, item_id, price) VALUES (?, ?, ?)",
        history_id,
        id,
        current_price
    )
    .execute(&state.db)
    .await;

    let item = sqlx::query_as!(
        WishlistItem,
        "SELECT id, wishlist_id, user_id, name, category, classification, priority, estimated_price, current_price, target_price, quantity, status, notes, shopee_url, shopee_item_id, shopee_shop_id, preferred_seller, preferred_shop, voucher_discount, has_free_shipping, rating, units_sold, is_in_stock, created_date, last_updated, purchased_date FROM items WHERE id = ?",
        id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(item))
}

async fn get_item(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(id): Path<String>,
) -> Result<Json<WishlistItem>, (StatusCode, String)> {
    let item = sqlx::query_as!(
        WishlistItem,
        "SELECT id, wishlist_id, user_id, name, category, classification, priority, estimated_price, current_price, target_price, quantity, status, notes, shopee_url, shopee_item_id, shopee_shop_id, preferred_seller, preferred_shop, voucher_discount, has_free_shipping, rating, units_sold, is_in_stock, created_date, last_updated, purchased_date FROM items WHERE id = ? AND user_id = ?",
        id,
        claims.sub
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or_else(|| (StatusCode::NOT_FOUND, "Item not found".to_string()))?;

    Ok(Json(item))
}

async fn update_item(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(id): Path<String>,
    Json(payload): Json<UpdateItemRequest>,
) -> Result<Json<WishlistItem>, (StatusCode, String)> {
    let current = sqlx::query_as!(
        WishlistItem,
        "SELECT id, wishlist_id, user_id, name, category, classification, priority, estimated_price, current_price, target_price, quantity, status, notes, shopee_url, shopee_item_id, shopee_shop_id, preferred_seller, preferred_shop, voucher_discount, has_free_shipping, rating, units_sold, is_in_stock, created_date, last_updated, purchased_date FROM items WHERE id = ? AND user_id = ?",
        id,
        claims.sub
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or_else(|| (StatusCode::NOT_FOUND, "Item not found".to_string()))?;

    let name = payload.name.unwrap_or(current.name);
    let category = payload.category.unwrap_or(current.category);
    let classification = payload.classification.unwrap_or(current.classification);
    let priority = payload.priority.unwrap_or(current.priority);
    let est_price = payload.estimated_price.unwrap_or(current.estimated_price);
    let curr_price = payload.current_price.unwrap_or(current.current_price);
    let tgt_price = payload.target_price.unwrap_or(current.target_price);
    let qty = payload.quantity.unwrap_or(current.quantity);
    let status = payload.status.unwrap_or(current.status);
    let notes = payload.notes.or(current.notes);
    let shopee_url = payload.shopee_url.or(current.shopee_url);
    let pref_seller = payload.preferred_seller.or(current.preferred_seller);
    let pref_shop = payload.preferred_shop.or(current.preferred_shop);
    let purchased_date = payload.purchased_date.or(current.purchased_date);

    sqlx::query!(
        r#"
        UPDATE items SET
            name = ?, category = ?, classification = ?, priority = ?,
            estimated_price = ?, current_price = ?, target_price = ?,
            quantity = ?, status = ?, notes = ?, shopee_url = ?,
            preferred_seller = ?, preferred_shop = ?, purchased_date = ?,
            last_updated = datetime('now')
        WHERE id = ?
        "#,
        name,
        category,
        classification,
        priority,
        est_price,
        curr_price,
        tgt_price,
        qty,
        status,
        notes,
        shopee_url,
        pref_seller,
        pref_shop,
        purchased_date,
        id
    )
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let updated = sqlx::query_as!(
        WishlistItem,
        "SELECT id, wishlist_id, user_id, name, category, classification, priority, estimated_price, current_price, target_price, quantity, status, notes, shopee_url, shopee_item_id, shopee_shop_id, preferred_seller, preferred_shop, voucher_discount, has_free_shipping, rating, units_sold, is_in_stock, created_date, last_updated, purchased_date FROM items WHERE id = ?",
        id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(updated))
}

async fn delete_item(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(id): Path<String>,
) -> Result<StatusCode, (StatusCode, String)> {
    let res = sqlx::query!(
        "DELETE FROM items WHERE id = ? AND user_id = ?",
        id,
        claims.sub
    )
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if res.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Item not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

async fn mark_purchased(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(id): Path<String>,
) -> Result<Json<WishlistItem>, (StatusCode, String)> {
    sqlx::query!(
        "UPDATE items SET status = 'Purchased', purchased_date = datetime('now'), last_updated = datetime('now') WHERE id = ? AND user_id = ?",
        id,
        claims.sub
    )
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let updated = sqlx::query_as!(
        WishlistItem,
        "SELECT id, wishlist_id, user_id, name, category, classification, priority, estimated_price, current_price, target_price, quantity, status, notes, shopee_url, shopee_item_id, shopee_shop_id, preferred_seller, preferred_shop, voucher_discount, has_free_shipping, rating, units_sold, is_in_stock, created_date, last_updated, purchased_date FROM items WHERE id = ?",
        id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(updated))
}

async fn restore_purchased(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(id): Path<String>,
) -> Result<Json<WishlistItem>, (StatusCode, String)> {
    sqlx::query!(
        "UPDATE items SET status = 'Waiting', purchased_date = NULL, last_updated = datetime('now') WHERE id = ? AND user_id = ?",
        id,
        claims.sub
    )
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let updated = sqlx::query_as!(
        WishlistItem,
        "SELECT id, wishlist_id, user_id, name, category, classification, priority, estimated_price, current_price, target_price, quantity, status, notes, shopee_url, shopee_item_id, shopee_shop_id, preferred_seller, preferred_shop, voucher_discount, has_free_shipping, rating, units_sold, is_in_stock, created_date, last_updated, purchased_date FROM items WHERE id = ?",
        id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(updated))
}

async fn manual_refresh_price(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(id): Path<String>,
) -> Result<Json<Option<f64>>, (StatusCode, String)> {
    let _ = sqlx::query!("SELECT id FROM items WHERE id = ? AND user_id = ?", id, claims.sub)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or_else(|| (StatusCode::NOT_FOUND, "Item not found".to_string()))?;

    let price = refresh_item_price(&state.db, &id).await.map_err(|e| (StatusCode::BAD_REQUEST, e))?;
    Ok(Json(price))
}

async fn get_price_history(
    State(state): State<Arc<AppState>>,
    AuthUser(_claims): AuthUser,
    Path(id): Path<String>,
) -> Result<Json<Vec<PriceHistory>>, (StatusCode, String)> {
    let history = sqlx::query_as!(
        PriceHistory,
        "SELECT id, item_id, price, voucher_adjusted_price, has_free_shipping, recorded_at FROM price_history WHERE item_id = ? ORDER BY recorded_at ASC",
        id
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(history))
}

async fn get_price_stats(
    State(state): State<Arc<AppState>>,
    AuthUser(_claims): AuthUser,
    Path(id): Path<String>,
) -> Result<Json<ItemPriceStats>, (StatusCode, String)> {
    let item = sqlx::query_as!(
        WishlistItem,
        "SELECT id, wishlist_id, user_id, name, category, classification, priority, estimated_price, current_price, target_price, quantity, status, notes, shopee_url, shopee_item_id, shopee_shop_id, preferred_seller, preferred_shop, voucher_discount, has_free_shipping, rating, units_sold, is_in_stock, created_date, last_updated, purchased_date FROM items WHERE id = ?",
        id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let prices: Vec<f64> = sqlx::query_scalar!("SELECT price FROM price_history WHERE item_id = ? ORDER BY recorded_at ASC", id)
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let current = if item.current_price > 0.0 { item.current_price } else { item.estimated_price };
    let lowest = prices.iter().cloned().fold(current, f64::min);
    let highest = prices.iter().cloned().fold(current, f64::max);

    let avg_30_day = if !prices.is_empty() {
        prices.iter().sum::<f64>() / (prices.len() as f64)
    } else {
        current
    };

    let avg_7_day = avg_30_day;
    let trend_percentage = if avg_30_day > 0.0 {
        ((current - avg_30_day) / avg_30_day) * 100.0
    } else {
        0.0
    };

    let (recommendation, recommendation_reason) = if current <= item.target_price && item.target_price > 0.0 {
        ("Recommend Buy".to_string(), "Current price is at or below your target price.".to_string())
    } else if (current - lowest).abs() < 0.01 {
        ("Recommend Buy".to_string(), "Current price is at the lowest recorded level.".to_string())
    } else if current > avg_30_day * 1.10 {
        ("Recommend Wait".to_string(), "Current price is over 10% above average price. Wait for discount.".to_string())
    } else {
        ("Neutral".to_string(), "Price is stable around normal baseline.".to_string())
    };

    Ok(Json(ItemPriceStats {
        current_price: current,
        lowest_recorded: lowest,
        highest_recorded: highest,
        avg_7_day,
        avg_30_day,
        trend_percentage,
        recommendation,
        recommendation_reason,
    }))
}
