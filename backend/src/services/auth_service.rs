use sqlx::SqlitePool;
use crate::models::user::{AuthResponse, LoginRequest, RegisterRequest, User};
use crate::utils::crypto::{create_jwt, hash_password, verify_password};

pub async fn register_user(
    pool: &SqlitePool,
    req: RegisterRequest,
    jwt_secret: &str,
) -> Result<AuthResponse, String> {
    let count = sqlx::query_scalar!("SELECT COUNT(*) FROM users")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    let role = if count == 0 { "admin" } else { "member" };

    let user_id = uuid::Uuid::new_v4().to_string();
    let password_hash = hash_password(&req.password)?;

    sqlx::query!(
        "INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
        user_id,
        req.username,
        req.email,
        password_hash,
        role
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Registration failed: {}", e))?;

    // Create default wishlist for user
    let wishlist_id = uuid::Uuid::new_v4().to_string();
    let default_name = "Main Wishlist";
    let _ = sqlx::query!(
        "INSERT INTO wishlists (id, user_id, name, monthly_budget, carryover_budget) VALUES (?, ?, ?, 3000.0, 0.0)",
        wishlist_id,
        user_id,
        default_name
    )
    .execute(pool)
    .await;

    // Create default user settings
    let _ = sqlx::query!(
        "INSERT INTO user_settings (user_id) VALUES (?)",
        user_id
    )
    .execute(pool)
    .await;

    let user = sqlx::query_as!(
        User,
        "SELECT id, username, email, password_hash, role, created_at FROM users WHERE id = ?",
        user_id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    let token = create_jwt(&user.id, &user.username, &user.role, jwt_secret)?;

    Ok(AuthResponse { token, user })
}

pub async fn login_user(
    pool: &SqlitePool,
    req: LoginRequest,
    jwt_secret: &str,
) -> Result<AuthResponse, String> {
    let user = sqlx::query_as!(
        User,
        "SELECT id, username, email, password_hash, role, created_at FROM users WHERE username = ?",
        req.username
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?
    .ok_or_else(|| "Invalid username or password".to_string())?;

    if !verify_password(&req.password, &user.password_hash) {
        return Err("Invalid username or password".to_string());
    }

    let token = create_jwt(&user.id, &user.username, &user.role, jwt_secret)?;

    Ok(AuthResponse { token, user })
}
