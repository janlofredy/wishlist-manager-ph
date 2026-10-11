use sqlx::sqlite::{SqliteConnectOptions, SqlitePool, SqlitePoolOptions};
use std::str::FromStr;
use std::path::Path;
use tracing::info;

pub mod migrations;

pub type DbPool = SqlitePool;

pub async fn init_db(database_url: &str) -> Result<DbPool, sqlx::Error> {
    // If SQLite file path doesn't exist, ensure directory is created
    if database_url.starts_with("sqlite:") {
        let clean_path = database_url
            .trim_start_matches("sqlite:")
            .split('?')
            .next()
            .unwrap_or("");
        if let Some(parent) = Path::new(clean_path).parent() {
            let _ = std::fs::create_dir_all(parent);
        }
    }

    let connection_options = SqliteConnectOptions::from_str(database_url)?
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .synchronous(sqlx::sqlite::SqliteSynchronous::Normal);

    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .connect_with(connection_options)
        .await?;

    info!("Database connected. Running migrations...");
    migrations::run_migrations(&pool).await?;
    info!("Database migrations completed successfully.");

    Ok(pool)
}
