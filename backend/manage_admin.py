"""Private CLI only. No public signup or automatic/default admin credentials.

ADMIN_EMAIL and ADMIN_PASSWORD must be supplied through the server environment.
python manage_admin.py create | reset-password | disable
"""
import asyncio
import os
import sys
from datetime import datetime, timezone
from uuid import uuid4
from email_validator import validate_email
from database import client, create_indexes, db
from auth_security import hash_password


async def main():
    action = sys.argv[1] if len(sys.argv) > 1 else ''
    if action not in ('create', 'reset-password', 'disable'):
        raise SystemExit('Usage: python manage_admin.py create|reset-password|disable (credentials from environment)')
    email = validate_email(os.environ['ADMIN_EMAIL'], check_deliverability=False).normalized.lower()
    await create_indexes()
    existing = await db.admin_users.find_one({'email': email}, {'_id': 0})
    if action == 'disable':
        if not existing:
            raise SystemExit('Admin account not found')
        await db.admin_users.update_one({'id': existing['id']}, {'$set': {'enabled': False, 'updated_at': datetime.now(timezone.utc)}})
        await db.admin_sessions.delete_many({'user_id': existing['id']})
    else:
        password = os.environ['ADMIN_PASSWORD']
        if len(password) < 12 or len(password.encode()) > 72:
            raise SystemExit('Use a password of at least 12 characters and at most 72 UTF-8 bytes')
        if action == 'create' and existing:
            raise SystemExit('Account already exists; no credentials changed')
        if action == 'reset-password' and not existing:
            raise SystemExit('Admin account not found')
        values = {'email': email, 'password_hash': await hash_password(password), 'role': 'admin', 'enabled': True, 'updated_at': datetime.now(timezone.utc)}
        if action == 'create':
            values.update({'id': str(uuid4()), 'created_at': datetime.now(timezone.utc)})
            await db.admin_users.insert_one(values)
        else:
            await db.admin_users.update_one({'id': existing['id']}, {'$set': values})
            await db.admin_sessions.delete_many({'user_id': existing['id']})
    print(f'Admin operation completed: {action}. No credentials printed.')
    client.close()


if __name__ == '__main__':
    asyncio.run(main())