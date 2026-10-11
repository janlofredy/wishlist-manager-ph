use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct CsvItemRow {
    pub priority: Option<i64>,
    pub item: String,
    pub category: String,
    pub classification: Option<String>,
    pub estimated_price: f64,
    pub status: Option<String>,
    pub target_price: Option<f64>,
}

pub fn parse_items_csv(csv_content: &str) -> Result<Vec<CsvItemRow>, String> {
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .trim(csv::Trim::All)
        .from_reader(csv_content.as_bytes());

    let mut rows = Vec::new();
    for result in reader.deserialize() {
        let record: CsvItemRow = result.map_err(|e| format!("CSV parse error: {}", e))?;
        rows.push(record);
    }
    Ok(rows)
}
