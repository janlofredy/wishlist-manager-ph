use sqlx::SqlitePool;
use crate::models::budget::{Budget, BudgetSummary, UpdateBudgetRequest};
use chrono::Datelike;

pub async fn get_or_create_monthly_budget(pool: &SqlitePool, user_id: &str, month_str: &str) -> Result<Budget, sqlx::Error> {
    let existing = sqlx::query_as::<_, Budget>(
        "SELECT id, user_id, month, monthly_salary, monthly_bills, emergency_fund_target, savings_allocation_percent, monthly_wishlist_budget, carryover_amount, spent_amount, created_at FROM budgets WHERE user_id = ? AND month = ?"
    )
    .bind(user_id)
    .bind(month_str)
    .fetch_optional(pool)
    .await?;

    if let Some(b) = existing {
        return Ok(b);
    }

    // Calculate carryover from previous month
    let prev_month = calculate_prev_month(month_str);
    let prev_budget = sqlx::query_as::<_, Budget>(
        "SELECT id, user_id, month, monthly_salary, monthly_bills, emergency_fund_target, savings_allocation_percent, monthly_wishlist_budget, carryover_amount, spent_amount, created_at FROM budgets WHERE user_id = ? AND month = ?"
    )
    .bind(user_id)
    .bind(&prev_month)
    .fetch_optional(pool)
    .await?;

    let carryover = match prev_budget {
        Some(pb) => {
            let total_available = pb.monthly_wishlist_budget + pb.carryover_amount;
            (total_available - pb.spent_amount).max(0.0)
        }
        None => 0.0,
    };

    let new_id = uuid::Uuid::new_v4().to_string();
    let default_salary = 18000.0;
    let default_bills = 10000.0;
    let default_ef = 50000.0;
    let default_savings_pct = 20.0;
    let default_wishlist_alloc = 3000.0;

    sqlx::query(
        r#"
        INSERT INTO budgets (
            id, user_id, month, monthly_salary, monthly_bills, emergency_fund_target,
            savings_allocation_percent, monthly_wishlist_budget, carryover_amount, spent_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0)
        "#
    )
    .bind(&new_id)
    .bind(user_id)
    .bind(month_str)
    .bind(default_salary)
    .bind(default_bills)
    .bind(default_ef)
    .bind(default_savings_pct)
    .bind(default_wishlist_alloc)
    .bind(carryover)
    .execute(pool)
    .await?;

    let created = sqlx::query_as::<_, Budget>(
        "SELECT id, user_id, month, monthly_salary, monthly_bills, emergency_fund_target, savings_allocation_percent, monthly_wishlist_budget, carryover_amount, spent_amount, created_at FROM budgets WHERE id = ?"
    )
    .bind(&new_id)
    .fetch_one(pool)
    .await?;

    Ok(created)
}

pub fn calculate_summary(budget: &Budget) -> BudgetSummary {
    let savings_target = budget.monthly_salary * (budget.savings_allocation_percent / 100.0);
    let total_available_wishlist_fund = budget.monthly_wishlist_budget + budget.carryover_amount;
    let remaining_wishlist_fund = (total_available_wishlist_fund - budget.spent_amount).max(0.0);
    let remaining_unallocated = budget.monthly_salary - budget.monthly_bills - savings_target - budget.monthly_wishlist_budget;

    BudgetSummary {
        month: budget.month.clone(),
        monthly_salary: budget.monthly_salary,
        monthly_bills: budget.monthly_bills,
        savings_target,
        emergency_fund_target: budget.emergency_fund_target,
        monthly_wishlist_budget: budget.monthly_wishlist_budget,
        carryover_amount: budget.carryover_amount,
        total_available_wishlist_fund,
        spent_amount: budget.spent_amount,
        remaining_wishlist_fund,
        remaining_unallocated_salary: remaining_unallocated,
    }
}

pub async fn update_budget(pool: &SqlitePool, user_id: &str, req: UpdateBudgetRequest) -> Result<Budget, sqlx::Error> {
    let current = get_or_create_monthly_budget(pool, user_id, &req.month).await?;

    let salary = req.monthly_salary.unwrap_or(current.monthly_salary);
    let bills = req.monthly_bills.unwrap_or(current.monthly_bills);
    let ef = req.emergency_fund_target.unwrap_or(current.emergency_fund_target);
    let savings_pct = req.savings_allocation_percent.unwrap_or(current.savings_allocation_percent);
    let wishlist_alloc = req.monthly_wishlist_budget.unwrap_or(current.monthly_wishlist_budget);

    sqlx::query(
        r#"
        UPDATE budgets SET
            monthly_salary = ?,
            monthly_bills = ?,
            emergency_fund_target = ?,
            savings_allocation_percent = ?,
            monthly_wishlist_budget = ?
        WHERE id = ?
        "#
    )
    .bind(salary)
    .bind(bills)
    .bind(ef)
    .bind(savings_pct)
    .bind(wishlist_alloc)
    .bind(&current.id)
    .execute(pool)
    .await?;

    get_or_create_monthly_budget(pool, user_id, &req.month).await
}

fn calculate_prev_month(month_str: &str) -> String {
    let parts: Vec<&str> = month_str.split('-').collect();
    if parts.len() != 2 {
        return "".to_string();
    }
    let year: i32 = parts[0].parse().unwrap_or(2026);
    let month: u32 = parts[1].parse().unwrap_or(1);

    if month == 1 {
        format!("{}-12", year - 1)
    } else {
        format!("{}-{:02}", year, month - 1)
    }
}
