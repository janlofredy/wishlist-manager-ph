use std::env;

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub port: u16,
    pub database_url: String,
    pub jwt_secret: String,
    pub telegram_bot_token: Option<String>,
    pub telegram_chat_id: Option<String>,
    pub discord_webhook_url: Option<String>,
    pub data_dir: String,
}

impl AppConfig {
    pub fn from_env() -> Self {
        let port = env::var("PORT")
            .unwrap_or_else(|_| "3000".to_string())
            .parse::<u16>()
            .unwrap_or(3000);

        let data_dir = env::var("DATA_DIR").unwrap_or_else(|_| "/app/data".to_string());
        let default_db = format!("sqlite:{}/wishlist.db?mode=rwc", data_dir);
        let database_url = env::var("DATABASE_URL").unwrap_or(default_db);

        let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "wishlist-secret-ph-2026-key-replace-in-prod".to_string());

        let telegram_bot_token = env::var("TELEGRAM_BOT_TOKEN").ok().filter(|s| !s.is_empty());
        let telegram_chat_id = env::var("TELEGRAM_CHAT_ID").ok().filter(|s| !s.is_empty());
        let discord_webhook_url = env::var("DISCORD_WEBHOOK_URL").ok().filter(|s| !s.is_empty());

        Self {
            port,
            database_url,
            jwt_secret,
            telegram_bot_token,
            telegram_chat_id,
            discord_webhook_url,
            data_dir,
        }
    }
}
