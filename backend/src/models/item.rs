use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct WishlistItem {
    pub id: String,
    pub wishlist_id: String,
    pub user_id: String,
    pub name: String,
    pub category: String,
    pub classification: String, // "Need" or "Want"
    pub priority: i64,          // 1: Quick Wins, 2: Utility/Hobby, 3: Mid-Cost, 4: Large
    pub estimated_price: f64,
    pub current_price: f64,
    pub target_price: f64,
    pub quantity: i64,
    pub status: String,         // "Waiting", "Watching Sale", "Ready To Buy", "Purchased", "Archived"
    pub notes: Option<String>,
    pub shopee_url: Option<String>,
    pub shopee_item_id: Option<String>,
    pub shopee_shop_id: Option<String>,
    pub preferred_seller: Option<String>,
    pub preferred_shop: Option<String>,
    pub voucher_discount: Option<f64>,
    pub has_free_shipping: Option<i64>,
    pub rating: Option<f64>,
    pub units_sold: Option<i64>,
    pub is_in_stock: Option<i64>,
    pub created_date: String,
    pub last_updated: String,
    pub purchased_date: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateItemRequest {
    pub wishlist_id: String,
    pub name: String,
    pub category: String,
    pub classification: Option<String>,
    pub priority: Option<i64>,
    pub estimated_price: f64,
    pub current_price: Option<f64>,
    pub target_price: Option<f64>,
    pub quantity: Option<i64>,
    pub status: Option<String>,
    pub notes: Option<String>,
    pub shopee_url: Option<String>,
    pub preferred_seller: Option<String>,
    pub preferred_shop: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateItemRequest {
    pub wishlist_id: Option<String>,
    pub name: Option<String>,
    pub category: Option<String>,
    pub classification: Option<String>,
    pub priority: Option<i64>,
    pub estimated_price: Option<f64>,
    pub current_price: Option<f64>,
    pub target_price: Option<f64>,
    pub quantity: Option<i64>,
    pub status: Option<String>,
    pub notes: Option<String>,
    pub shopee_url: Option<String>,
    pub preferred_seller: Option<String>,
    pub preferred_shop: Option<String>,
    pub purchased_date: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct PriceHistory {
    pub id: String,
    pub item_id: String,
    pub price: f64,
    pub voucher_adjusted_price: Option<f64>,
    pub has_free_shipping: Option<i64>,
    pub recorded_at: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct ItemPriceStats {
    pub current_price: f64,
    pub lowest_recorded: f64,
    pub highest_recorded: f64,
    pub avg_7_day: f64,
    pub avg_30_day: f64,
    pub trend_percentage: f64,
    pub recommendation: String, // "Recommend Buy", "Recommend Wait", "Neutral"
    pub recommendation_reason: String,
}
