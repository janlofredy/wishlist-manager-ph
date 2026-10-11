use axum::{
    http::{header, Method},
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::{ServeDir, ServeFile};
use tracing::info;

mod config;
mod db;
mod models;
mod routes;
mod services;
mod utils;

pub struct AppState {
    pub db: db::DbPool,
    pub config: config::AppConfig,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,wishlist_manager_ph_backend=debug".into()),
        )
        .init();

    let config = config::AppConfig::from_env();
    info!("Starting Wishlist Manager PH with config: port={}, data_dir={}", config.port, config.data_dir);

    let pool = db::init_db(&config.database_url).await?;

    let state = Arc::new(AppState {
        db: pool.clone(),
        config: config.clone(),
    });

    // Start background Shopee price refresher cron every 24 hours
    let bg_pool = pool.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(86400));
        loop {
            interval.tick().await;
            info!("Running 24-hour scheduled Shopee price sync...");
            let items: Result<Vec<String>, _> = sqlx::query_scalar!(
                "SELECT id FROM items WHERE shopee_url IS NOT NULL AND status IN ('Waiting', 'Watching Sale')"
            )
            .fetch_all(&bg_pool)
            .await;

            if let Ok(ids) = items {
                for id in ids {
                    let _ = services::shopee_tracker::refresh_item_price(&bg_pool, &id).await;
                    tokio::time::sleep(std::time::Duration::from_secs(2)).await;
                }
            }
        }
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
        .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE, header::ACCEPT]);

    let api_routes = Router::new()
        .nest("/auth", routes::auth::router())
        .nest("/wishlists", routes::wishlists::router())
        .nest("/items", routes::items::router())
        .nest("/budget", routes::budget::router())
        .nest("/advisor", routes::advisor::router())
        .nest("/system", routes::notifications::router())
        .nest("/backups", routes::backups::router());

    // Single-container serving: static assets from ./frontend/build or /app/frontend/build
    let frontend_dir = std::env::var("FRONTEND_DIR").unwrap_or_else(|_| "frontend/build".to_string());
    let index_file = format!("{}/index.html", frontend_dir);

    let static_service = ServeDir::new(&frontend_dir)
        .not_found_service(ServeFile::new(index_file));

    let app = Router::new()
        .nest("/api", api_routes)
        .fallback_service(static_service)
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    info!("Wishlist Manager PH listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
