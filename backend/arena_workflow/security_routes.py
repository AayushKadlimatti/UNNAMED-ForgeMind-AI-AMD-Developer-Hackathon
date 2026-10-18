"""Temporary shared-token DEMO authentication, with server-controlled roles.

Replace get_current_user with verified OIDC/OAuth2 identity for deployment.
Never trust X-User-Role or client-provided usernames.
"""
from dataclasses import dataclass
import hashlib
import hmac
import json
import os

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..configuration import trusted_origins
from .database import get_db
from .models import AuditLog
from .schemas import AuditLogResponse, ErrorResponse

router = APIRouter(prefix="/api/v1/admin", tags=["Administration"])
bearer = HTTPBearer(auto_error=False, description="Local demo bearer token. Roles are assigned server-side.")


@dataclass(frozen=True)
class User:
    username: str
    role: str


def load_demo_credentials():
    admin = os.getenv("FORGEMIND_ADMIN_TOKEN", "")
    technician = os.getenv("FORGEMIND_TECHNICIAN_TOKEN", "")
    if not admin and not technician:
        return ()  # health/docs work; protected endpoints fail closed with 503
    if any(len(token) < 32 or len(token) > 512 or not token.isascii() or
           any(char.isspace() for char in token) for token in (admin, technician)):
        raise ValueError("Set BOTH demo tokens to distinct 32–512 character ASCII values without whitespace.")
    if hmac.compare_digest(admin, technician):
        raise ValueError("Administrator and technician demo tokens must differ.")
    return tuple((hashlib.sha256(token.encode()).digest(), User(name, role)) for token, name, role in (
        (admin, "demo-admin", "admin"), (technician, "demo-technician", "technician")))


def record_audit(db: Session, user: User, action: str, details: dict):
    """Caller supplies only curated metadata, never headers or arbitrary payloads.

    No commit here: successful mutations and their audit record are atomic.
    """
    db.add(AuditLog(username=user.username, action=action,
                    details=json.dumps(details, sort_keys=True, ensure_ascii=True)))


def commit_changes(db: Session):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Conflict with existing data or database constraints.") from None


def get_current_user(request: Request,
                     credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
                     db: Session = Depends(get_db)) -> User:
    configured = request.app.state.demo_credentials
    if not configured:
        raise HTTPException(status_code=503, detail="Demo authentication is not configured. See README.")
    token = credentials.credentials if credentials is not None else request.cookies.get('forgemind_session')
    if token:
        digest = hashlib.sha256(token.encode()).digest()
        for expected, user in configured:
            if hmac.compare_digest(digest, expected):
                if credentials is None:
                    check_session_origin(request, db, user)
                return user
    record_audit(db, User("anonymous", "anonymous"), "AUTHENTICATION_DENIED",
                 {"reason": "missing_or_invalid_credentials"})
    commit_changes(db)  # persist denied attempts even though request raises below
    raise HTTPException(status_code=401, detail="Valid demo bearer token required.",
                        headers={"WWW-Authenticate": "Bearer"})


def check_session_origin(request: Request, db: Session, user: User):
    """SameSite cookie plus an origin check for browser writes; no origin value is logged."""
    if request.method not in ('GET', 'HEAD', 'OPTIONS'):
        origin = request.headers.get('origin')
        if origin and origin not in trusted_origins():
            record_audit(db, user, 'ACCESS_DENIED', {'reason': 'untrusted_session_origin'})
            commit_changes(db)
            raise HTTPException(403, 'Session request origin is not allowed')


def require_admin(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    if user.role != "admin":
        record_audit(db, user, "ACCESS_DENIED", {"required_role": "admin"})
        commit_changes(db)
        raise HTTPException(status_code=403, detail="Administrator role required.")
    return user


@router.get("/audit-logs", response_model=list[AuditLogResponse],
            responses={401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}})
def audit_logs(offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
               user: User = Depends(require_admin), db: Session = Depends(get_db)):
    # Ascending immutable IDs make offset pagination predictable for this demo.
    return db.scalars(select(AuditLog).order_by(AuditLog.id).offset(offset).limit(limit)).all()
