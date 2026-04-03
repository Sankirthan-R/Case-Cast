from __future__ import annotations

from typing import Any, Dict

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from supabase_clients import SupabaseClients


bearer_scheme = HTTPBearer(auto_error=False)


class AuthService:
    def __init__(self, clients: SupabaseClients) -> None:
        self.clients = clients

    def signup(self, email: str, password: str, username: str | None = None) -> Dict[str, Any]:
        response = self.clients.anon.auth.sign_up(
            {
                "email": email,
                "password": password,
                "options": {"data": {"username": username or ""}},
            }
        )
        if getattr(response, "user", None) is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Signup failed")

        return {
            "user": {
                "id": response.user.id,
                "email": response.user.email,
            },
            "session": {
                "access_token": getattr(getattr(response, "session", None), "access_token", None),
                "refresh_token": getattr(getattr(response, "session", None), "refresh_token", None),
            },
            "message": "User created. If email confirmation is enabled, verify your inbox.",
        }

    def login(self, email: str, password: str) -> Dict[str, Any]:
        response = self.clients.anon.auth.sign_in_with_password({"email": email, "password": password})
        if getattr(response, "session", None) is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "token_type": "bearer",
            "expires_in": response.session.expires_in,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
            },
        }

    def validate_access_token(self, token: str) -> Dict[str, Any]:
        response = self.clients.anon.auth.get_user(token)
        user = getattr(response, "user", None)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
        return {
            "id": user.id,
            "email": user.email,
            "raw": user,
        }



def get_bearer_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    return credentials.credentials
