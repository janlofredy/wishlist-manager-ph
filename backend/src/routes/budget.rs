use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, put},
    Router,
};
use serde::Deserialize;
use std::sync::Arc;
use crate::models::budget::{Budget, BudgetSummary, UpdateBudgetRequest};
use crate::routes::auth_middleware::AuthUser;
use crate::services::budget_engine::{calculate_summary, get_or_create_monthly_budget, update_budget};
use crate::AppState;
use chrono::Local;

#[derive(Debug, Deserialize)]
pub struct BudgetQuery {
    pub month: Option<String>,
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(get_budget).put(modify_budget))
        .route("/summary", get(get_summary))
}

async fn get_budget(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Query(query): Query<BudgetQuery>,
) -> Result<Json<Budget>, (StatusCode, String)> {
    let month_str = query.month.unwrap_or_else(|| Local::now().format("%Y-%m").to_string());
    let b = get_or_create_monthly_budget(&state.db, &claims.sub, &month_str)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(b))
}

async fn get_summary(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Query(query): Query<BudgetQuery>,
) -> Result<Json<BudgetSummary>, (StatusCode, String)> {
    let month_str = query.month.unwrap_or_else(|| Local::now().format("%Y-%m").to_string());
    let b = get_or_create_monthly_budget(&state.db, &claims.sub, &month_str)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(calculate_summary(&b)))
}

async fn modify_budget(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Json(payload): Json<UpdateBudgetRequest>,
) -> Result<Json<BudgetSummary>, (StatusCode, String)> {
    let b = update_budget(&state.db, &claims.sub, payload)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(calculate_summary(&b)))
}
