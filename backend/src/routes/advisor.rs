use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::get,
    Router,
};
use serde::Deserialize;
use std::sync::Arc;
use crate::routes::auth_middleware::AuthUser;
use crate::services::advisor_engine::{
    evaluate_should_i_buy_this, evaluate_what_should_i_buy, AdvisorRecommendation, DecisionAssistantResult,
};
use crate::services::budget_engine::get_or_create_monthly_budget;
use crate::services::health_score::{compute_health_score, HealthScoreBreakdown};
use crate::AppState;
use chrono::Local;

#[derive(Debug, Deserialize)]
pub struct AdvisorQuery {
    pub custom_budget: Option<f64>,
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/what-should-i-buy", get(what_should_i_buy))
        .route("/should-i-buy/:item_id", get(should_i_buy))
        .route("/health-score", get(get_health))
}

async fn what_should_i_buy(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Query(query): Query<AdvisorQuery>,
) -> Result<Json<Vec<AdvisorRecommendation>>, (StatusCode, String)> {
    let month_str = Local::now().format("%Y-%m").to_string();
    let budget = get_or_create_monthly_budget(&state.db, &claims.sub, &month_str)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let available = query.custom_budget.unwrap_or(
        (budget.monthly_wishlist_budget + budget.carryover_amount - budget.spent_amount).max(0.0),
    );

    let recs = evaluate_what_should_i_buy(&state.db, &claims.sub, available)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(recs))
}

async fn should_i_buy(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(item_id): Path<String>,
) -> Result<Json<DecisionAssistantResult>, (StatusCode, String)> {
    let month_str = Local::now().format("%Y-%m").to_string();
    let budget = get_or_create_monthly_budget(&state.db, &claims.sub, &month_str)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let available = (budget.monthly_wishlist_budget + budget.carryover_amount - budget.spent_amount).max(0.0);

    let result = evaluate_should_i_buy_this(
        &state.db,
        &claims.sub,
        &item_id,
        budget.monthly_wishlist_budget,
        available,
    )
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}

async fn get_health(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<Json<HealthScoreBreakdown>, (StatusCode, String)> {
    let health = compute_health_score(&state.db, &claims.sub)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(health))
}
