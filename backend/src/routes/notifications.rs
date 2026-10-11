use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{get, post, put},
    Router,
};
use std::sync::Arc;
use crate::models::notification::{HappinessMetric, Notification, SubmitHappinessRequest, UpdateUserSettingsRequest, UserSettings};
use crate::routes::auth_middleware::AuthUser;
use crate::services::sale_calendar::{get_upcoming_ph_sale_events, SaleEvent};
use crate::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/notifications", get(list_notifications))
        .route("/notifications/:id/read", post(mark_notification_read))
        .route("/settings", get(get_settings).put(update_settings))
        .route("/sale-calendar", get(get_sale_calendar))
        .route("/happiness", get(list_happiness).post(submit_happiness))
}

async fn list_notifications(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<Json<Vec<Notification>>, (StatusCode, String)> {
    let notifs = sqlx::query_as!(
        Notification,
        "SELECT id, user_id, item_id, title, message, alert_type, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        claims.sub
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(notifs))
}

async fn mark_notification_read(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(id): Path<String>,
) -> Result<StatusCode, (StatusCode, String)> {
    let _ = sqlx::query!(
        "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
        id,
        claims.sub
    )
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::OK)
}

async fn get_settings(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<Json<UserSettings>, (StatusCode, String)> {
    let settings = sqlx::query_as!(
        UserSettings,
        "SELECT user_id, telegram_chat_id, discord_webhook_url, webpush_subscription, enable_telegram, enable_discord, enable_webpush FROM user_settings WHERE user_id = ?",
        claims.sub
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .unwrap_or(UserSettings {
        user_id: claims.sub,
        telegram_chat_id: None,
        discord_webhook_url: None,
        webpush_subscription: None,
        enable_telegram: Some(0),
        enable_discord: Some(0),
        enable_webpush: Some(0),
    });

    Ok(Json(settings))
}

async fn update_settings(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Json(payload): Json<UpdateUserSettingsRequest>,
) -> Result<Json<UserSettings>, (StatusCode, String)> {
    let enable_tg = payload.enable_telegram.map(|b| if b { 1 } else { 0 });
    let enable_dc = payload.enable_discord.map(|b| if b { 1 } else { 0 });
    let enable_wp = payload.enable_webpush.map(|b| if b { 1 } else { 0 });

    sqlx::query!(
        r#"
        INSERT INTO user_settings (user_id, telegram_chat_id, discord_webhook_url, webpush_subscription, enable_telegram, enable_discord, enable_webpush)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            telegram_chat_id = COALESCE(excluded.telegram_chat_id, user_settings.telegram_chat_id),
            discord_webhook_url = COALESCE(excluded.discord_webhook_url, user_settings.discord_webhook_url),
            webpush_subscription = COALESCE(excluded.webpush_subscription, user_settings.webpush_subscription),
            enable_telegram = COALESCE(excluded.enable_telegram, user_settings.enable_telegram),
            enable_discord = COALESCE(excluded.enable_discord, user_settings.enable_discord),
            enable_webpush = COALESCE(excluded.enable_webpush, user_settings.enable_webpush)
        "#,
        claims.sub,
        payload.telegram_chat_id,
        payload.discord_webhook_url,
        payload.webpush_subscription,
        enable_tg,
        enable_dc,
        enable_wp
    )
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let s = get_settings(State(state), AuthUser(claims)).await?;
    Ok(s)
}

async fn get_sale_calendar() -> Json<Vec<SaleEvent>> {
    Json(get_upcoming_ph_sale_events())
}

async fn list_happiness(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<Json<Vec<HappinessMetric>>, (StatusCode, String)> {
    let metrics = sqlx::query_as!(
        HappinessMetric,
        "SELECT id, user_id, item_id, interval_type, satisfaction_score, regret_score, reflection_note, recorded_at FROM happiness_metrics WHERE user_id = ? ORDER BY recorded_at DESC",
        claims.sub
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(metrics))
}

async fn submit_happiness(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Json(payload): Json<SubmitHappinessRequest>,
) -> Result<Json<HappinessMetric>, (StatusCode, String)> {
    let id = uuid::Uuid::new_v4().to_string();

    sqlx::query!(
        "INSERT INTO happiness_metrics (id, user_id, item_id, interval_type, satisfaction_score, regret_score, reflection_note) VALUES (?, ?, ?, ?, ?, ?, ?)",
        id,
        claims.sub,
        payload.item_id,
        payload.interval_type,
        payload.satisfaction_score,
        payload.regret_score,
        payload.reflection_note
    )
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let created = sqlx::query_as!(
        HappinessMetric,
        "SELECT id, user_id, item_id, interval_type, satisfaction_score, regret_score, reflection_note, recorded_at FROM happiness_metrics WHERE id = ?",
        id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(created))
}
