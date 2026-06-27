from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings

_bearer = HTTPBearer()


def verify_supabase_jwt(
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
) -> dict:
    """
    Validates the Supabase JWT sent by the frontend as Bearer token.
    Returns the decoded payload (contains 'sub' = Supabase user UUID).
    """
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.supabase_jwt_secret,
            algorithms=['HS256'],
            audience='authenticated',
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f'Invalid or expired token: {exc}',
        )
