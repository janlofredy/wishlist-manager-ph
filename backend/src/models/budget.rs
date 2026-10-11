use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct Budget {
    pub id: String,
    pub user_id: String,
    pub month: String, // "YYYY-MM"
    pub monthly_salary: f64,
    pub monthly_bills: f64,
    pub emergency_fund_target: f64,
    pub savings_allocation_percent: f64,
    pub monthly_wishlist_budget: f64,
    pub carryover_amount: f64,
    pub spent_amount: f64,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBudgetRequest {
    pub month: String,
    pub monthly_salary: Option<f64>,
    pub monthly_bills: Option<f64>,
    pub emergency_fund_target: Option<f64>,
    pub savings_allocation_percent: Option<f64>,
    pub monthly_wishlist_budget: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct BudgetSummary {
    pub month: String,
    pub monthly_salary: f64,
    pub monthly_bills: f64,
    pub savings_target: f64,
    pub emergency_fund_target: f64,
    pub monthly_wishlist_budget: f64,
    pub carryover_amount: f64,
    pub total_available_wishlist_fund: f64,
    pub spent_amount: f64,
    pub remaining_wishlist_fund: f64,
    pub remaining_unallocated_salary: f64,
}
