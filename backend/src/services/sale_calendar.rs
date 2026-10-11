use serde::Serialize;
use chrono::{Datelike, Local, NaiveDate};

#[derive(Debug, Serialize, Clone)]
pub struct SaleEvent {
    pub name: String,
    pub date_str: String,
    pub days_remaining: i64,
    pub description: String,
    pub estimated_discount: String,
    pub voucher_tip: String,
}

pub fn get_upcoming_ph_sale_events() -> Vec<SaleEvent> {
    let today = Local::now().date_naive();
    let current_year = today.year();
    let current_month = today.month();

    let mut events = Vec::new();

    // 1. Payday Sales (15th and end of month)
    let mid_month_date = NaiveDate::from_ymd_opt(current_year, current_month, 15).unwrap_or(today);
    if mid_month_date >= today {
        let diff = (mid_month_date - today).num_days();
        events.push(SaleEvent {
            name: "Mid-Month Payday Sale".to_string(),
            date_str: mid_month_date.format("%B 15, %Y").to_string(),
            days_remaining: diff,
            description: "Shopee Mid-Month Payday Sale with sitewide free shipping & coins cashback vouchers.".to_string(),
            estimated_discount: "10% - 20% Off".to_string(),
            voucher_tip: "Claim 15% off ShopeePay/SPayLater vouchers at midnight.".to_string(),
        });
    }

    // End of month payday sale (e.g. 30th)
    let end_month_date = NaiveDate::from_ymd_opt(current_year, current_month, 28).unwrap_or(today);
    if end_month_date >= today {
        let diff = (end_month_date - today).num_days();
        events.push(SaleEvent {
            name: "Month-End Payday Sale".to_string(),
            date_str: end_month_date.format("%B 30, %Y").to_string(),
            days_remaining: diff,
            description: "Sweldo Mega Payday vouchers and flash discounts on electronics and appliances.".to_string(),
            estimated_discount: "15% - 25% Off".to_string(),
            voucher_tip: "Stack shop vouchers + category vouchers during sweldo rush.".to_string(),
        });
    }

    // 2. Double-Digit Mega Sales (e.g. 10.10, 11.11, 12.12)
    for m in [10, 11, 12] {
        if let Some(sale_date) = NaiveDate::from_ymd_opt(current_year, m, m) {
            if sale_date >= today {
                let diff = (sale_date - today).num_days();
                let name = match m {
                    10 => "10.10 Brands Festival",
                    11 => "11.11 Mega Sale (Biggest of the Year)",
                    12 => "12.12 Christmas Mega Sale",
                    _ => "Double-Digit Sale",
                };
                events.push(SaleEvent {
                    name: name.to_string(),
                    date_str: sale_date.format("%B %d, %Y").to_string(),
                    days_remaining: diff,
                    description: "Major annual mega sale featuring 0-min flash deals, PHP 0 min spend free shipping.".to_string(),
                    estimated_discount: "20% - 60% Off".to_string(),
                    voucher_tip: "Add items to cart 3 days prior; checkout at 12:00 AM sharp.".to_string(),
                });
            }
        }
    }

    // 3. Christmas & Year-End Sale
    if let Some(xmas_date) = NaiveDate::from_ymd_opt(current_year, 12, 25) {
        if xmas_date >= today {
            events.push(SaleEvent {
                name: "Christmas Gift Rush Sale".to_string(),
                date_str: xmas_date.format("%B 25, %Y").to_string(),
                days_remaining: (xmas_date - today).num_days(),
                description: "Last-minute holiday clearance with priority local shipping.".to_string(),
                estimated_discount: "15% - 30% Off".to_string(),
                voucher_tip: "Great time for Priority 1 and 2 Quick Win items.".to_string(),
            });
        }
    }

    events.sort_by_key(|e| e.days_remaining);
    events
}
