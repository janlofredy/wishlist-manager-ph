use sqlx::{Row, SqlitePool};
use tracing::{info, warn};
use regex::Regex;

pub async fn refresh_item_price(pool: &SqlitePool, item_id: &str) -> Result<Option<f64>, String> {
    let row = sqlx::query("SELECT id, shopee_url, current_price, target_price FROM items WHERE id = ?")
        .bind(item_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;

    let row = match row {
        Some(r) => r,
        None => return Ok(None),
    };

    let url_opt: Option<String> = row.try_get("shopee_url").ok();
    let url = match url_opt {
        Some(u) if !u.is_empty() => u,
        _ => return Ok(None),
    };

    let new_price = scrape_shopee_ph_price(&url).await?;

    if let Some(price) = new_price {
        // Record in price_history
        let history_id = uuid::Uuid::new_v4().to_string();
        let _ = sqlx::query("INSERT INTO price_history (id, item_id, price) VALUES (?, ?, ?)")
            .bind(&history_id)
            .bind(item_id)
            .bind(price)
            .execute(pool)
            .await;

        // Update current_price on item
        let _ = sqlx::query("UPDATE items SET current_price = ?, last_updated = datetime('now') WHERE id = ?")
            .bind(price)
            .bind(item_id)
            .execute(pool)
            .await;

        info!("Updated price for item {} to PHP {}", item_id, price);
        Ok(Some(price))
    } else {
        Ok(None)
    }
}

pub async fn scrape_shopee_ph_price(url: &str) -> Result<Option<f64>, String> {
    let re = Regex::new(r"i\.(\d+)\.(\d+)").unwrap();
    let re_slash = Regex::new(r"shopee\.ph/product/(\d+)/(\d+)").unwrap();

    let mut shop_id = None;
    let mut item_id = None;

    if let Some(caps) = re.captures(url) {
        shop_id = Some(caps.get(1).unwrap().as_str());
        item_id = Some(caps.get(2).unwrap().as_str());
    } else if let Some(caps) = re_slash.captures(url) {
        shop_id = Some(caps.get(1).unwrap().as_str());
        item_id = Some(caps.get(2).unwrap().as_str());
    }

    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    if let (Some(s_id), Some(i_id)) = (shop_id, item_id) {
        let api_url = format!("https://shopee.ph/api/v4/item/get?itemid={}&shopid={}", i_id, s_id);
        if let Ok(resp) = client.get(&api_url).send().await {
            if let Ok(json) = resp.json::<serde_json::Value>().await {
                if let Some(price_raw) = json.pointer("/data/price").and_then(|v| v.as_f64()) {
                    let actual_price = price_raw / 100_000.0;
                    return Ok(Some(actual_price));
                }
            }
        }
    }

    match client.get(url).send().await {
        Ok(resp) => {
            if let Ok(html) = resp.text().await {
                let price_re = Regex::new(r#"property="product:price:amount"\s+content="([0-9.]+)""#).unwrap();
                if let Some(caps) = price_re.captures(&html) {
                    if let Ok(parsed) = caps.get(1).unwrap().as_str().parse::<f64>() {
                        return Ok(Some(parsed));
                    }
                }
            }
        }
        Err(e) => {
            warn!("Could not scrape Shopee PH URL: {}", e);
        }
    }

    Ok(None)
}
