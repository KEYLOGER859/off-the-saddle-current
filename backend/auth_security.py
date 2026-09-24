import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4
import bcrypt
import jwt
from fastapi import HTTPException, Request, Response
from starlette.concurrency import run_in_threadpool
from database import db

JWT_SECRET = os.environ['JWT_SECRET']
ORIGIN = os.environ['FRONTEND_ORIGIN'].rstrip('/')
if len(JWT_SECRET) < 64 or not ORIGIN.startswith('https://'):
    raise RuntimeError('A strong JWT_SECRET and HTTPS FRONTEND_ORIGIN are required')
ISSUER = 'off-the-saddle-admin'
ACCESS_SECONDS = 15 * 60
SESSION_SECONDS = 7 * 24 * 60 * 60
DUMMY_HASH = bcrypt.hashpw(secrets.token_bytes(32), bcrypt.gensalt())


def now():
    return datetime.now(timezone.utc)


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def check_origin(request: Request):
    if request.headers.get('origin', '').rstrip('/') != ORIGIN:
        raise HTTPException(403, 'Request origin is not allowed')


async def hash_password(password):
    return (await run_in_threadpool(bcrypt.hashpw, password.encode(), bcrypt.gensalt(rounds=12))).decode()


async def verify_password(password, hashed):
    if len(password.encode()) > 72:
        return False
    return await run_in_threadpool(bcrypt.checkpw, password.encode(), hashed.encode() if isinstance(hashed, str) else hashed)


def decode(token, token_type):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'], issuer=ISSUER,
                             options={'require': ['exp', 'iat', 'sub', 'sid', 'type', 'csrf']})
        if payload['type'] != token_type:
            raise jwt.InvalidTokenError()
        return payload
    except jwt.PyJWTError:
        raise HTTPException(401, 'Your session has expired. Please sign in again.')


def set_tokens(response: Response, user, session_id, csrf, refresh_jti, expires_at):
    base = {'sub': user['id'], 'sid': session_id, 'csrf': csrf, 'iss': ISSUER, 'iat': now()}
    access = jwt.encode({**base, 'type': 'access', 'exp': now() + timedelta(seconds=ACCESS_SECONDS)}, JWT_SECRET, algorithm='HS256')
    refresh = jwt.encode({**base, 'type': 'refresh', 'jti': refresh_jti, 'exp': expires_at}, JWT_SECRET, algorithm='HS256')
    response.set_cookie('ots_admin_access', access, max_age=ACCESS_SECONDS, httponly=True, secure=True, samesite='none', path='/api')
    response.set_cookie('ots_admin_refresh', refresh, max_age=max(0, int((expires_at - now()).total_seconds())), httponly=True, secure=True, samesite='none', path='/api/admin/auth')


async def issue_session(response, user):
    sid, csrf, jti = str(uuid4()), secrets.token_urlsafe(32), secrets.token_urlsafe(32)
    expires = now() + timedelta(seconds=SESSION_SECONDS)
    await db.admin_sessions.insert_one({'id': sid, 'user_id': user['id'], 'refresh_hash': digest(jti), 'csrf_hash': digest(csrf), 'expires_at': expires, 'created_at': now()})
    set_tokens(response, user, sid, csrf, jti, expires)
    return csrf


def clear_cookies(response):
    response.delete_cookie('ots_admin_access', path='/api', secure=True, httponly=True, samesite='none')
    response.delete_cookie('ots_admin_refresh', path='/api/admin/auth', secure=True, httponly=True, samesite='none')


async def require_admin(request: Request):
    token = request.cookies.get('ots_admin_access')
    if not token:
        raise HTTPException(401, 'Sign in to continue')
    payload = decode(token, 'access')
    session = await db.admin_sessions.find_one({'id': payload['sid'], 'user_id': payload['sub'], 'expires_at': {'$gt': now()}}, {'_id': 0})
    user = await db.admin_users.find_one({'id': payload['sub'], 'enabled': True}, {'_id': 0, 'password_hash': 0})
    if not session or not user:
        raise HTTPException(401, 'Sign in to continue')
    if user.get('role') != 'admin':
        raise HTTPException(403, 'Administrator access is required')
    request.state.admin_session = session
    request.state.admin_csrf = payload['csrf']
    return user


async def require_admin_write(request: Request):
    check_origin(request)
    user = await require_admin(request)
    csrf = request.headers.get('x-csrf-token', '')
    if not csrf or not secrets.compare_digest(digest(csrf), request.state.admin_session['csrf_hash']):
        raise HTTPException(403, 'Invalid request verification token')
    return user