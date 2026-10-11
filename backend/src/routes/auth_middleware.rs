use axum::{
    extract::{FromRequestParts, State},
    http::{request::Parts, StatusCode},
};
use std::sync::Arc;
use crate::models::user::UserClaims;
use crate::utils::crypto::verify_jwt;
use crate::AppState;

pub struct AuthUser(pub UserClaims);

#[axum::async_trait]
impl FromRequestParts<Arc<AppState>> for AuthUser {
    type Rejection = (StatusCode, &'static str);

    async fn from_request_parts(
        parts: &mut Parts,
        state: &Arc<AppState>,
    ) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|h| h.to_str().ok());

        let token = match auth_header {
            Some(header) if header.starts_with("Bearer ") => &header[7..],
            _ => return Err((StatusCode::UNAUTHORIZED, "Missing or invalid Authorization header")),
        };

        match verify_jwt(token, &state.config.jwt_secret) {
            Ok(claims) => Ok(AuthUser(claims)),
            Err(_) => Err((StatusCode::UNAUTHORIZED, "Invalid or expired token")),
        }
    }
}
