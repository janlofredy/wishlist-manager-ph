use sqlx::SqlitePool;
use tracing::{info, warn};

pub async fn dispatch_notification(
    pool: &SqlitePool,
    user_id: &str,
    item_id: Option<&str>,
    title: &str,
    message: &str,
    alert_type: &str,
) -> Result<(), String> {
    // 1. Record In-App notification
    let notif_id = uuid::Uuid::new_v4().to_string();
    let _ = sqlx::query!(
        "INSERT INTO notifications (id, user_id, item_id, title, message, alert_type) VALUES (?, ?, ?, ?, ?, ?)",
        notif_id,
        user_id,
        item_id,
        title,
        message,
        alert_type
    )
    .execute(pool)
    .await;

    // 2. Fetch User Channel Settings
    let settings = sqlx::query!(
        "SELECT telegram_chat_id, discord_webhook_url, enable_telegram, enable_discord FROM user_settings WHERE user_id = ?",
        user_id
    )
    .fetch_optional(pool)
    .await
    .unwrap_or(None);

    let client = reqwest::Client::new();

    if let Some(s) = settings {
        // Telegram dispatch
        if s.enable_telegram == Some(1) {
            if let Some(chat_id) = s.telegram_chat_id {
                let token = std::env::var("TELEGRAM_BOT_TOKEN").unwrap_or_default();
                if !token.is_empty() && !chat_id.is_empty() {
                    let telegram_url = format!("https://api.telegram.org/bot{}/sendMessage", token);
                    let payload = serde_json::json!({
                        "chat_id": chat_id,
                        "text": format!("🇵🇭 *Wishlist Manager PH Alert*\n\n*{}*\n{}\n\nType: `{}`", title, message, alert_type),
                        "parse_mode": "Markdown"
                    });
                    let _ = client.post(&telegram_url).json(&payload).send().await;
                }
            }
        }

        // Discord Webhook dispatch
        if s.enable_discord == Some(1) {
            if let Some(hook_url) = s.discord_webhook_url {
                if !hook_url.is_empty() {
                    let payload = serde_json::json!({
                        "username": "Wishlist Manager PH",
                        "avatar_url": "https://cdn-icons-png.flaticon.com/512/3081/3081840.png",
                        "embeds": [{
                            "title": title,
                            "description": message,
                            "color": 3447003,
                            "footer": { "text": format!("Alert Category: {}", alert_type) }
                        }]
                    });
                    let _ = client.post(&hook_url).json(&payload).send().await;
                }
            }
        }
    }

    Ok(())
}
