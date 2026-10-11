use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct Wishlist {
    pub id: String,
    pub user_id: String,
    pub name: String,
    pub description: Option<String>,
    pub monthly_budget: f64,
    pub carryover_budget: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateWishlistRequest {
    pub name: String,
    pub description: Option<String>,
    pub monthly_budget: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateWishlistRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub monthly_budget: Option<f64>,
    pub carryover_budget: Option<f64>,
}
