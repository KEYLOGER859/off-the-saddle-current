import secrets
from datetime import timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field, field_validator
from database import db
from auth_security import (DUMMY_HASH, check_origin, clear_cookies, decode, digest,
                           hash_password, issue_session, now, require_admin,
                           require_admin_write, set_tokens, verify_password)

router = APIRouter(prefix='/api/admin/auth', tags=['Admin authentication'])


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=512)


class PasswordInput(BaseModel):
    current_password: str = Field(min_length=1, max_length=512)
    new_password: str = Field(min_length=12, max_length=72)

    @field_validator('new_password')
    @classmethod
    def check_bytes(cls, value):
        if len(value.encode()) > 72:
            raise ValueError('Password must be at most 72 UTF-8 bytes')
        return value


class AdminIdentity(BaseModel):
    id: str
    email: str
    role: str


class AuthResponse(BaseModel):
    admin: AdminIdentity
    csrf_token: str


@router.post('/login', response_model=AuthResponse)
async def login(body: LoginInput, request: Request, response: Response):
    check_origin(request)
    email = str(body.email).lower().strip()
    identifier = digest(f'{request.client.host}:{email}')
    attempt = await db.login_attempts.find_one({'identifier': identifier, 'expires_at': {'$gt': now()}}, {'_id': 0})
    if attempt and attempt.get('count', 0) >= 5:
        raise HTTPException(429, 'Too many sign-in attempts. Please try again in 15 minutes.', headers={'Retry-After': '900'})
    user = await db.admin_users.find_one({'email': email}, {'_id': 0})
    valid = await verify_password(body.password, user['password_hash'] if user else DUMMY_HASH)
    if not valid or not user or not user.get('enabled') or user.get('role') != 'admin':
        if not attempt:
            await db.login_attempts.delete_one({'identifier': identifier})
        await db.login_attempts.update_one({'identifier': identifier}, {'$inc': {'count': 1}, '$set': {'expires_at': now() + timedelta(minutes=15)}}, upsert=True)
        raise HTTPException(401, 'Email or password is incorrect')
    await db.login_attempts.delete_one({'identifier': identifier})
    csrf = await issue_session(response, user)
    return AuthResponse(admin=AdminIdentity(**user), csrf_token=csrf)


@router.get('/me', response_model=AuthResponse)
async def me(request: Request, admin=Depends(require_admin)):
    return AuthResponse(admin=AdminIdentity(**admin), csrf_token=request.state.admin_csrf)


@router.post('/refresh', response_model=AuthResponse)
async def refresh(request: Request, response: Response):
    check_origin(request)
    token = request.cookies.get('ots_admin_refresh')
    if not token:
        raise HTTPException(401, 'Sign in to continue')
    claims = decode(token, 'refresh')
    user = await db.admin_users.find_one({'id': claims['sub'], 'enabled': True, 'role': 'admin'}, {'_id': 0, 'password_hash': 0})
    if not user or not claims.get('jti'):
        raise HTTPException(401, 'Sign in to continue')
    new_jti = secrets.token_urlsafe(32)
    session = await db.admin_sessions.find_one_and_update(
        {'id': claims['sid'], 'user_id': claims['sub'], 'refresh_hash': digest(claims['jti']), 'expires_at': {'$gt': now()}},
        {'$set': {'refresh_hash': digest(new_jti)}}, projection={'_id': 0})
    if not session:
        raise HTTPException(401, 'Sign in to continue')
    set_tokens(response, user, session['id'], claims['csrf'], new_jti, session['expires_at'].replace(tzinfo=timezone.utc))
    return AuthResponse(admin=AdminIdentity(**user), csrf_token=claims['csrf'])


@router.post('/logout', status_code=204)
async def logout(request: Request, response: Response, admin=Depends(require_admin_write)):
    await db.admin_sessions.delete_one({'id': request.state.admin_session['id']})
    clear_cookies(response)


@router.post('/password', status_code=204)
async def password(body: PasswordInput, request: Request, response: Response, admin=Depends(require_admin_write)):
    record = await db.admin_users.find_one({'id': admin['id']}, {'_id': 0, 'password_hash': 1})
    if not await verify_password(body.current_password, record['password_hash']):
        raise HTTPException(400, 'Current password is incorrect')
    await db.admin_users.update_one({'id': admin['id']}, {'$set': {'password_hash': await hash_password(body.new_password), 'updated_at': now()}})
    await db.admin_sessions.delete_many({'user_id': admin['id']})
    clear_cookies(response)