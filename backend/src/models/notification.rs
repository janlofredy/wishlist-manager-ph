use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct Notification {
    pub id: String,
    pub user_id: String,
    pub item_id: Option<String>,
    pub title: String,
    pub message: String,
    pub alert_type: String,
    pub is_read: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct HappinessMetric {
    pub id: String,
    pub user_id: String,
    pub item_id: String,
    pub interval_type: String, // '1_week', '1_month', '3_months'
    pub satisfaction_score: i64, // 1 to 5
    pub regret_score: i64,       // 1 to 5
    pub reflection_note: Option<String>,
    pub recorded_at: String,
}

#[derive(Debug, Deserialize)]
pub struct SubmitHappinessRequest {
    pub item_id: String,
    pub interval_type: String,
    pub satisfaction_score: i64,
    pub regret_score: i64,
    pub reflection_note: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct UserSettings {
    pub user_id: String,
    pub telegram_chat_id: Option<String>,
    pub discord_webhook_url: Option<String>,
    pub webpush_subscription: Option<String>,
    pub enable_telegram: Option<i64>,
    pub enable_discord: Option<i64>,
    pub enable_webpush: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserSettingsRequest {
    pub telegram_chat_id: Option<String>,
    pub discord_webhook_url: Option<String>,
    pub webpush_subscription: Option<String>,
    pub enable_telegram: Option<bool>,
    pub enable_discord: Option<bool>,
    pub enable_webpush: Option<bool>,
}
