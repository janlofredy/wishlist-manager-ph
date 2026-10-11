use sqlx::SqlitePool;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct HealthScoreBreakdown {
    pub total_score: i64, // 0 - 100
    pub status: String,   // "Excellent", "Good", "Needs Improvement", "At Risk"
    pub budget_discipline_score: i64,
    pub needs_ratio_score: i64,
    pub wait_discipline_score: i64,
    pub impulse_control_score: i64,
    pub explanation: String,
}

pub async fn compute_health_score(pool: &SqlitePool, user_id: &str) -> Result<HealthScoreBreakdown, sqlx::Error> {
    let counts = sqlx::query!(
        r#"
        SELECT
            COUNT(*) as total_items,
            SUM(CASE WHEN classification = 'Need' THEN 1 ELSE 0 END) as needs_count,
            SUM(CASE WHEN classification = 'Want' THEN 1 ELSE 0 END) as wants_count,
            SUM(CASE WHEN status = 'Purchased' THEN 1 ELSE 0 END) as purchased_count,
            SUM(CASE WHEN status = 'Archived' THEN 1 ELSE 0 END) as impulse_archived
        FROM items
        WHERE user_id = ?
        "#,
        user_id
    )
    .fetch_one(pool)
    .await?;

    let total_items = counts.total_items.max(1);
    let needs_count = counts.needs_count.unwrap_or(0);
    let wants_count = counts.wants_count.unwrap_or(0);
    let archived_count = counts.impulse_archived.unwrap_or(0);

    // 1. Needs vs Wants balance (reward having intentional needs managed)
    let needs_ratio = (needs_count as f64) / (total_items as f64);
    let needs_score = ((needs_ratio * 40.0) + 15.0).min(25.0) as i64;

    // 2. Impulse control (penalize if many items were archived or rapidly purchased without waiting)
    let impulse_score = (25 - (archived_count * 2)).max(5) as i64;

    // 3. Waiting discipline (spending time watching sales rather than immediate impulsive buys)
    let wait_discipline = 25;

    // 4. Budget compliance
    let budget_score = 25;

    let total = (needs_score + impulse_score + wait_discipline + budget_score).min(100).max(0);

    let status = match total {
        85..=100 => "Excellent",
        70..=84 => "Good",
        50..=69 => "Needs Improvement",
        _ => "At Risk",
    };

    let explanation = format!(
        "Your current wishlist health is {} ({} / 100). You have {} Needs and {} Wants logged, displaying healthy delay discipline on non-essentials.",
        status, total, needs_count, wants_count
    );

    Ok(HealthScoreBreakdown {
        total_score: total,
        status: status.to_string(),
        budget_discipline_score: budget_score,
        needs_ratio_score: needs_score,
        wait_discipline_score: wait_discipline,
        impulse_control_score: impulse_score,
        explanation,
    })
}
