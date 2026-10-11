use axum::{
    extract::{Multipart, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Json},
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use crate::models::item::WishlistItem;
use crate::models::wishlist::Wishlist;
use crate::routes::auth_middleware::AuthUser;
use crate::utils::csv_parser::parse_items_csv;
use crate::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/export/csv", get(export_csv))
        .route("/import/csv", post(import_csv))
        .route("/export/json", get(export_json))
        .route("/preload-starter", post(preload_starter))
}

async fn export_csv(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let items = sqlx::query_as!(
        WishlistItem,
        r#"
        SELECT id, wishlist_id, user_id, name, category, classification, priority,
               estimated_price, current_price, target_price, quantity, status, notes,
               shopee_url, shopee_item_id, shopee_shop_id, preferred_seller, preferred_shop,
               voucher_discount, has_free_shipping, rating, units_sold, is_in_stock,
               created_date, last_updated, purchased_date
        FROM items WHERE user_id = ?
        ORDER BY priority ASC, created_date ASC
        "#,
        claims.sub
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut wtr = csv::Writer::from_writer(vec![]);
    wtr.write_record(&["priority", "item", "category", "classification", "estimated_price", "status", "target_price", "shopee_url"])
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    for i in items {
        wtr.write_record(&[
            i.priority.to_string(),
            i.name,
            i.category,
            i.classification,
            i.estimated_price.to_string(),
            i.status,
            i.target_price.to_string(),
            i.shopee_url.unwrap_or_default(),
        ])
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    let csv_data = wtr.into_inner().map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut headers = HeaderMap::new();
    headers.insert(header::CONTENT_TYPE, "text/csv".parse().unwrap());
    headers.insert(
        header::CONTENT_DISPOSITION,
        "attachment; filename=\"wishlist_ph_export.csv\"".parse().unwrap(),
    );

    Ok((headers, csv_data))
}

async fn import_csv(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let mut default_wishlist = sqlx::query_as!(
        Wishlist,
        "SELECT id, user_id, name, description, monthly_budget, carryover_budget, created_at, updated_at FROM wishlists WHERE user_id = ? LIMIT 1",
        claims.sub
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let wishlist_id = match default_wishlist {
        Some(w) => w.id,
        None => {
            let new_id = uuid::Uuid::new_v4().to_string();
            let _ = sqlx::query!(
                "INSERT INTO wishlists (id, user_id, name, monthly_budget) VALUES (?, ?, 'Imported Wishlist', 3000.0)",
                new_id,
                claims.sub
            )
            .execute(&state.db)
            .await;
            new_id
        }
    };

    let mut count = 0;

    while let Some(field) = multipart.next_field().await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))? {
        if let Ok(text) = field.text().await {
            if let Ok(rows) = parse_items_csv(&text) {
                for r in rows {
                    let id = uuid::Uuid::new_v4().to_string();
                    let priority = r.priority.unwrap_or(2);
                    let class = r.classification.unwrap_or_else(|| "Want".to_string());
                    let status = r.status.unwrap_or_else(|| "Waiting".to_string());
                    let target = r.target_price.unwrap_or(r.estimated_price * 0.85);

                    let _ = sqlx::query!(
                        r#"
                        INSERT INTO items (
                            id, wishlist_id, user_id, name, category, classification, priority,
                            estimated_price, current_price, target_price, status
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        "#,
                        id,
                        wishlist_id,
                        claims.sub,
                        r.item,
                        r.category,
                        class,
                        priority,
                        r.estimated_price,
                        r.estimated_price,
                        target,
                        status
                    )
                    .execute(&state.db)
                    .await;

                    count += 1;
                }
            }
        }
    }

    Ok(Json(serde_json::json!({ "imported_count": count })))
}

async fn preload_starter(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let wishlist_id = match sqlx::query_scalar!("SELECT id FROM wishlists WHERE user_id = ? LIMIT 1", claims.sub)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    {
        Some(id) => id,
        None => {
            let new_id = uuid::Uuid::new_v4().to_string();
            let _ = sqlx::query!("INSERT INTO wishlists (id, user_id, name) VALUES (?, ?, 'Main Wishlist')", new_id, claims.sub)
                .execute(&state.db)
                .await;
            new_id
        }
    };

    let csv_path = format!("{}/starter_wishlist.csv", state.config.data_dir);
    let starter_csv = std::fs::read_to_string(&csv_path)
        .or_else(|_| std::fs::read_to_string("data/starter_wishlist.csv"))
        .unwrap_or_default();

    if starter_csv.trim().is_empty() {
        return Ok(Json(serde_json::json!({ "preloaded_count": 0, "message": "No starter CSV file found" })));
    }

    let rows = parse_items_csv(&starter_csv).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    let mut added = 0;
    for r in rows {
        let id = uuid::Uuid::new_v4().to_string();
        let priority = r.priority.unwrap_or(2);
        let class = r.classification.unwrap_or_else(|| "Want".to_string());
        let status = r.status.unwrap_or_else(|| "Waiting".to_string());
        let target = r.target_price.unwrap_or(r.estimated_price * 0.85);

        let _ = sqlx::query!(
            r#"
            INSERT INTO items (
                id, wishlist_id, user_id, name, category, classification, priority,
                estimated_price, current_price, target_price, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            id,
            wishlist_id,
            claims.sub,
            r.item,
            r.category,
            class,
            priority,
            r.estimated_price,
            r.estimated_price,
            target,
            status
        )
        .execute(&state.db)
        .await;

        added += 1;
    }

    Ok(Json(serde_json::json!({ "preloaded_count": added })))
}

async fn export_json(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let wishlists = sqlx::query_as!(Wishlist, "SELECT id, user_id, name, description, monthly_budget, carryover_budget, created_at, updated_at FROM wishlists WHERE user_id = ?", claims.sub)
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let items = sqlx::query_as!(WishlistItem, "SELECT id, wishlist_id, user_id, name, category, classification, priority, estimated_price, current_price, target_price, quantity, status, notes, shopee_url, shopee_item_id, shopee_shop_id, preferred_seller, preferred_shop, voucher_discount, has_free_shipping, rating, units_sold, is_in_stock, created_date, last_updated, purchased_date FROM items WHERE user_id = ?", claims.sub)
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(serde_json::json!({
        "wishlists": wishlists,
        "items": items,
        "exported_at": chrono::Utc::now().to_rfc3339()
    })))
}
