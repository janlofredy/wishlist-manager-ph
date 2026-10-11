CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wishlists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    monthly_budget REAL NOT NULL DEFAULT 3000.0,
    carryover_budget REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    wishlist_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    classification TEXT NOT NULL DEFAULT 'Want',
    priority INTEGER NOT NULL DEFAULT 2,
    estimated_price REAL NOT NULL DEFAULT 0.0,
    current_price REAL NOT NULL DEFAULT 0.0,
    target_price REAL NOT NULL DEFAULT 0.0,
    quantity INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'Waiting',
    notes TEXT,
    shopee_url TEXT,
    shopee_item_id TEXT,
    shopee_shop_id TEXT,
    preferred_seller TEXT,
    preferred_shop TEXT,
    voucher_discount REAL DEFAULT 0.0,
    has_free_shipping INTEGER DEFAULT 0,
    rating REAL,
    units_sold INTEGER,
    is_in_stock INTEGER DEFAULT 1,
    created_date TEXT NOT NULL DEFAULT (datetime('now')),
    last_updated TEXT NOT NULL DEFAULT (datetime('now')),
    purchased_date TEXT,
    FOREIGN KEY(wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS price_history (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    price REAL NOT NULL,
    voucher_adjusted_price REAL,
    has_free_shipping INTEGER DEFAULT 0,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    month TEXT NOT NULL,
    monthly_salary REAL NOT NULL DEFAULT 18000.0,
    monthly_bills REAL NOT NULL DEFAULT 10000.0,
    emergency_fund_target REAL NOT NULL DEFAULT 50000.0,
    savings_allocation_percent REAL NOT NULL DEFAULT 20.0,
    monthly_wishlist_budget REAL NOT NULL DEFAULT 3000.0,
    carryover_amount REAL NOT NULL DEFAULT 0.0,
    spent_amount REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, month),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    item_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS happiness_metrics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    interval_type TEXT NOT NULL,
    satisfaction_score INTEGER NOT NULL,
    regret_score INTEGER NOT NULL,
    reflection_note TEXT,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    telegram_chat_id TEXT,
    discord_webhook_url TEXT,
    webpush_subscription TEXT,
    enable_telegram INTEGER DEFAULT 0,
    enable_discord INTEGER DEFAULT 0,
    enable_webpush INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
