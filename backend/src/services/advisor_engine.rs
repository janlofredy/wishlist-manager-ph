use sqlx::SqlitePool;
use crate::models::item::WishlistItem;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct AdvisorRecommendation {
    pub item: WishlistItem,
    pub recommendation: String, // "Buy Now", "Wait For Sale", "Save Up", "Avoid For Now"
    pub score: f64,
    pub rationale: String,
}

#[derive(Debug, Serialize)]
pub struct OpportunityCostReport {
    pub target_item: WishlistItem,
    pub alternatives_unlocked_sooner: Vec<AlternativeUnlock>,
    pub delays_caused: Vec<ItemDelayImpact>,
}

#[derive(Debug, Serialize)]
pub struct AlternativeUnlock {
    pub item_name: String,
    pub price: f64,
    pub months_sooner: f64,
}

#[derive(Debug, Serialize)]
pub struct ItemDelayImpact {
    pub item_name: String,
    pub classification: String,
    pub price: f64,
    pub months_delayed: f64,
}

#[derive(Debug, Serialize)]
pub struct DecisionAssistantResult {
    pub item_id: String,
    pub item_name: String,
    pub price: f64,
    pub verdict: String, // "Buy Now", "Wait For Sale", "Save More", "Not Recommended"
    pub explanation: String,
    pub delay_impacts: Vec<ItemDelayImpact>,
    pub savings_impact_pct: f64,
}

pub async fn evaluate_what_should_i_buy(
    pool: &SqlitePool,
    user_id: &str,
    available_budget: f64,
) -> Result<Vec<AdvisorRecommendation>, sqlx::Error> {
    let items = sqlx::query_as!(
        WishlistItem,
        r#"
        SELECT id, wishlist_id, user_id, name, category, classification, priority,
               estimated_price, current_price, target_price, quantity, status, notes,
               shopee_url, shopee_item_id, shopee_shop_id, preferred_seller, preferred_shop,
               voucher_discount, has_free_shipping, rating, units_sold, is_in_stock,
               created_date, last_updated, purchased_date
        FROM items
        WHERE user_id = ? AND status IN ('Waiting', 'Watching Sale', 'Ready To Buy')
        ORDER BY priority ASC, estimated_price ASC
        "#,
        user_id
    )
    .fetch_all(pool)
    .await?;

    let mut recommendations = Vec::new();

    for item in items {
        let effective_price = if item.current_price > 0.0 {
            item.current_price
        } else {
            item.estimated_price
        };

        let is_need = item.classification.eq_ignore_ascii_case("Need");
        let can_afford = effective_price <= available_budget;
        let meets_target = item.target_price > 0.0 && effective_price <= item.target_price;

        let (verdict, score, rationale) = if is_need && can_afford {
            (
                "Buy Now".to_string(),
                95.0 - (item.priority as f64 * 5.0),
                format!("High-priority Need (PHP {:.2}) is fully funded within available budget (PHP {:.2}). Buying this has immediate utility.", effective_price, available_budget),
            )
        } else if meets_target && can_afford {
            (
                "Buy Now".to_string(),
                90.0 - (item.priority as f64 * 5.0),
                format!("Price dropped to or below target price of PHP {:.2} (Current: PHP {:.2}). Excellent deal.", item.target_price, effective_price),
            )
        } else if can_afford && !is_need && item.priority <= 2 {
            (
                "Buy Now".to_string(),
                75.0,
                format!("Affordable Quick Win / Utility want (PHP {:.2}). Leaves remaining PHP {:.2}.", effective_price, available_budget - effective_price),
            )
        } else if !can_afford && effective_price <= available_budget * 2.5 {
            (
                "Save Up".to_string(),
                50.0,
                format!("Item costs PHP {:.2}, which exceeds current balance PHP {:.2}. Recommended 1-2 months additional rollover saving.", effective_price, available_budget),
            )
        } else if item.priority == 4 || effective_price > 7000.0 {
            (
                "Wait For Sale".to_string(),
                35.0,
                format!("Large purchase (PHP {:.2}). Wait for upcoming Payday or Double-Digit Sale discounts.", effective_price),
            )
        } else {
            (
                "Avoid For Now".to_string(),
                20.0,
                format!("Non-essential want requiring higher capital accumulation without immediate payoff."),
            )
        };

        recommendations.push(AdvisorRecommendation {
            item,
            recommendation: verdict,
            score,
            rationale,
        });
    }

    recommendations.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
    Ok(recommendations)
}

pub async fn evaluate_should_i_buy_this(
    pool: &SqlitePool,
    user_id: &str,
    item_id: &str,
    monthly_wishlist_budget: f64,
    current_wishlist_fund: f64,
) -> Result<DecisionAssistantResult, sqlx::Error> {
    let item = sqlx::query_as!(
        WishlistItem,
        r#"
        SELECT id, wishlist_id, user_id, name, category, classification, priority,
               estimated_price, current_price, target_price, quantity, status, notes,
               shopee_url, shopee_item_id, shopee_shop_id, preferred_seller, preferred_shop,
               voucher_discount, has_free_shipping, rating, units_sold, is_in_stock,
               created_date, last_updated, purchased_date
        FROM items
        WHERE id = ? AND user_id = ?
        "#,
        item_id,
        user_id
    )
    .fetch_one(pool)
    .await?;

    let effective_price = if item.current_price > 0.0 { item.current_price } else { item.estimated_price };
    let is_need = item.classification.eq_ignore_ascii_case("Need");

    // Fetch other active items to calculate delay impacts
    let other_items = sqlx::query_as!(
        WishlistItem,
        r#"
        SELECT id, wishlist_id, user_id, name, category, classification, priority,
               estimated_price, current_price, target_price, quantity, status, notes,
               shopee_url, shopee_item_id, shopee_shop_id, preferred_seller, preferred_shop,
               voucher_discount, has_free_shipping, rating, units_sold, is_in_stock,
               created_date, last_updated, purchased_date
        FROM items
        WHERE user_id = ? AND id != ? AND status IN ('Waiting', 'Watching Sale')
        ORDER BY priority ASC, estimated_price ASC
        LIMIT 5
        "#,
        user_id,
        item_id
    )
    .fetch_all(pool)
    .await?;

    let safe_monthly = if monthly_wishlist_budget > 0.0 { monthly_wishlist_budget } else { 3000.0 };
    let months_delayed_raw = effective_price / safe_monthly;

    let mut delay_impacts = Vec::new();
    for other in other_items {
        delay_impacts.push(ItemDelayImpact {
            item_name: other.name,
            classification: other.classification,
            price: if other.current_price > 0.0 { other.current_price } else { other.estimated_price },
            months_delayed: (months_delayed_raw * 10.0).round() / 10.0,
        });
    }

    let savings_impact_pct = if current_wishlist_fund > 0.0 {
        ((effective_price / current_wishlist_fund) * 100.0).min(100.0)
    } else {
        100.0
    };

    let (verdict, explanation) = if is_need && effective_price <= current_wishlist_fund {
        (
            "Buy Now".to_string(),
            format!("'{}' is a critical Need and is within current available funds (PHP {:.2}). It has first claim on budget.", item.name, current_wishlist_fund),
        )
    } else if !is_need && effective_price > current_wishlist_fund {
        (
            "Save More".to_string(),
            format!("'{}' is a Want priced at PHP {:.2}, which exceeds your current fund of PHP {:.2}. Buying now would trigger debt or eat into your Emergency Fund.", item.name, effective_price, current_wishlist_fund),
        )
    } else if !is_need && delay_impacts.iter().any(|d| d.classification.eq_ignore_ascii_case("Need")) {
        (
            "Not Recommended".to_string(),
            format!("Purchasing this Want now delays essential Needs on your list by approximately {:.1} months.", months_delayed_raw),
        )
    } else if effective_price <= current_wishlist_fund {
        (
            "Buy Now".to_string(),
            format!("Item is within current available budget. Minimal disruption to essential targets."),
        )
    } else {
        (
            "Wait For Sale".to_string(),
            format!("Consider waiting for an upcoming 15th/30th Payday or Mega Sale voucher to discount PHP {:.2}.", effective_price),
        )
    };

    Ok(DecisionAssistantResult {
        item_id: item.id,
        item_name: item.name,
        price: effective_price,
        verdict,
        explanation,
        delay_impacts,
        savings_impact_pct,
    })
}
