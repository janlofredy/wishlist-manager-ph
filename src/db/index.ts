import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

// Support configurable data directory (defaults to ./data or /app/data in Docker)
const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "wishlist.db");
const sqlite = new Database(dbPath);

// Enable SQLite Write-Ahead Logging (WAL) for superior concurrency and performance
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Initialize tables automatically if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER,
    image TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS account (
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    providerAccountId TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    PRIMARY KEY (provider, providerAccountId),
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS session (
    sessionToken TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    expires INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS verificationToken (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires INTEGER NOT NULL,
    PRIMARY KEY (identifier, token)
  );

  CREATE TABLE IF NOT EXISTS financial_profile (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    avg_monthly_income REAL NOT NULL DEFAULT 0,
    monthly_bills REAL NOT NULL DEFAULT 0,
    savings_rate_percent REAL NOT NULL DEFAULT 20,
    custom_wishlist_budget REAL,
    suggested_wishlist_budget REAL DEFAULT 0,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS wishlist (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'Sparkles',
    color TEXT DEFAULT '#3b82f6',
    monthly_budget REAL DEFAULT 0,
    rollover_balance REAL DEFAULT 0,
    is_default INTEGER DEFAULT 0,
    created_at TEXT,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS item (
    id TEXT PRIMARY KEY,
    wishlist_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    priority INTEGER NOT NULL DEFAULT 2,
    is_need INTEGER NOT NULL DEFAULT 0,
    estimated_price REAL NOT NULL,
    current_price REAL NOT NULL,
    target_price REAL,
    quantity INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'Waiting',
    notes TEXT,
    shopee_url TEXT,
    image_url TEXT,
    seller_rating REAL,
    units_sold INTEGER,
    stock_status TEXT DEFAULT 'In Stock',
    last_checked TEXT,
    purchased_at TEXT,
    parent_item_id TEXT,
    created_at TEXT,
    FOREIGN KEY (wishlist_id) REFERENCES wishlist(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS item_alternative (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    title TEXT NOT NULL,
    price REAL NOT NULL,
    shopee_url TEXT,
    notes TEXT,
    is_selected INTEGER DEFAULT 0,
    created_at TEXT,
    FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS price_history (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    price REAL NOT NULL,
    voucher_adjusted_price REAL,
    recorded_at TEXT,
    FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS satisfaction_rating (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    period TEXT NOT NULL,
    rating INTEGER NOT NULL,
    regret_score INTEGER DEFAULT 0,
    feedback TEXT,
    recorded_at TEXT,
    FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_badge (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    badge_type TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    unlocked_at TEXT,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  );
`);

// Safe runtime migration for existing databases
try {
  sqlite.exec("ALTER TABLE item ADD COLUMN parent_item_id TEXT;");
} catch (e) {
  // column already exists
}

export const db = drizzle(sqlite, { schema });
