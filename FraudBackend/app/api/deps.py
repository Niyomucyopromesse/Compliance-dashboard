"""API dependencies and middleware."""

from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from ..config import settings
from ..logging_config import get_logger

logger = get_logger(__name__)

# Security scheme
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Get current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        
        # In a real application, you would fetch user from database
        # For now, return a mock user
        return {
            "id": user_id,
            "name": payload.get("name", "User"),
            "email": payload.get("email", "user@example.com"),
            "role": payload.get("role", "viewer"),
            "permissions": payload.get("permissions", [])
        }
    except JWTError:
        raise credentials_exception


async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[Dict[str, Any]]:
    """Get current user from JWT token (optional)."""
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


def require_permission(permission: str):
    """Decorator to require specific permission."""
    def permission_checker(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        if user.get("role") == "admin" or permission in user.get("permissions", []):
            return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission '{permission}' required"
        )
    return permission_checker


def require_role(role: str):
    """Decorator to require specific role."""
    def role_checker(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        if user.get("role") == role or user.get("role") == "admin":
            return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{role}' required"
        )
    return role_checker


# Common query parameters
async def get_pagination_params(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    sort_by: Optional[str] = Query(None, description="Field to sort by"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order")
) -> Dict[str, Any]:
    """Get pagination parameters."""
    return {
        "page": page,
        "page_size": page_size,
        "sort_by": sort_by,
        "sort_order": sort_order
    }


async def get_search_params(
    search: Optional[str] = Query(None, description="Search term"),
    date_from: Optional[str] = Query(None, description="Start date (ISO format)"),
    date_to: Optional[str] = Query(None, description="End date (ISO format)"),
    risk_level: Optional[str] = Query(None, description="Risk level filter")
) -> Dict[str, Any]:
    """Get search parameters."""
    return {
        "search": search,
        "date_from": date_from,
        "date_to": date_to,
        "risk_level": risk_level
    }
