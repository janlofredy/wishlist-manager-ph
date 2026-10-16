import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ==========================================
// 1. NextAuth / Auth.js Tables (Google SSO)
// ==========================================
export const users = sqliteTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const accounts = sqliteTable("account", {
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable("verificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

// ==========================================
// 2. Dynamic Financial Profile Table
// ==========================================
export const financialProfiles = sqliteTable("financial_profile", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  avgMonthlyIncome: real("avg_monthly_income").notNull().default(0),
  monthlyBills: real("monthly_bills").notNull().default(0),
  savingsRatePercent: real("savings_rate_percent").notNull().default(20), // Target savings % (default 20%)
  customWishlistBudget: real("custom_wishlist_budget"), // User manual override
  suggestedWishlistBudget: real("suggested_wishlist_budget").default(0), // Smart engine calculation
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// ==========================================
// 3. Category Wishlists (With Independent Budgets)
// ==========================================
export const wishlists = sqliteTable("wishlist", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon").default("Sparkles"), // Lucide icon name or emoji
  color: text("color").default("#3b82f6"), // hex badge color
  monthlyBudget: real("monthly_budget").default(0),
  rolloverBalance: real("rollover_balance").default(0),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// ==========================================
// 4. Wishlist Items (With Needs vs. Wants & Priority)
// ==========================================
export const items = sqliteTable("item", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  wishlistId: text("wishlist_id")
    .notNull()
    .references(() => wishlists.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull().default("General"),
  priority: integer("priority").notNull().default(2), // 1: Quick Wins, 2: Utility & Hobby, 3: Mid-Cost, 4: Large Purchases
  isNeed: integer("is_need", { mode: "boolean" }).notNull().default(false), // 🛡️ Need (true) vs ✨ Want (false)
  estimatedPrice: real("estimated_price").notNull(),
  currentPrice: real("current_price").notNull(),
  targetPrice: real("target_price"),
  quantity: integer("quantity").notNull().default(1),
  status: text("status").notNull().default("Waiting"), // 'Waiting', 'Watching Sale', 'Ready To Buy', 'Purchased', 'Archived'
  notes: text("notes"),
  shopeeUrl: text("shopee_url"),
  imageUrl: text("image_url"),
  sellerRating: real("seller_rating"),
  unitsSold: integer("units_sold"),
  stockStatus: text("stock_status").default("In Stock"),
  lastChecked: text("last_checked"),
  purchasedAt: text("purchased_at"),
  parentItemId: text("parent_item_id"), // If set, this item is an "Either/Or" alternative to another item
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// ==========================================
// 5. Alternative Items / Links (Either-Or choices)
// ==========================================
export const itemAlternatives = sqliteTable("item_alternative", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // e.g. "iPad Air (M2)" vs "iPad Mini"
  price: real("price").notNull(),
  shopeeUrl: text("shopee_url"),
  notes: text("notes"), // e.g. "Better screen, higher cost"
  isSelected: integer("is_selected", { mode: "boolean" }).default(false),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// ==========================================
// 6. Price Tracking History
// ==========================================
export const priceHistory = sqliteTable("price_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  price: real("price").notNull(),
  voucherAdjustedPrice: real("voucher_adjusted_price"),
  recordedAt: text("recorded_at").$defaultFn(() => new Date().toISOString()),
});

// ==========================================
// 6. Post-Purchase Happiness & Regret Ratings
// ==========================================
export const satisfactionRatings = sqliteTable("satisfaction_rating", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  period: text("period").notNull(), // '1_week', '1_month', '3_month'
  rating: integer("rating").notNull(), // 1 to 5 stars
  regretScore: integer("regret_score").default(0), // 0 to 100
  feedback: text("feedback"),
  recordedAt: text("recorded_at").$defaultFn(() => new Date().toISOString()),
});

// ==========================================
// 7. Gamification Discipline Badges
// ==========================================
export const userBadges = sqliteTable("user_badge", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  badgeType: text("badge_type").notNull(), // 'IMPULSE_SHIELD', 'SALE_SNIPER', 'FORTRESS_BUILDER', 'GOAL_CRUSHER', 'FIRST_STEP'
  badgeName: text("badge_name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  unlockedAt: text("unlocked_at").$defaultFn(() => new Date().toISOString()),
});
