import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket

load_dotenv(Path(__file__).parent / '.env')
client = AsyncIOMotorClient(os.environ['MONGO_URL'], serverSelectionTimeoutMS=10000)
db = client[os.environ['DB_NAME']]
image_bucket = AsyncIOMotorGridFSBucket(db, bucket_name='product_images')


async def create_indexes():
    await db.products.create_index('id', unique=True)
    await db.products.create_index('sku', unique=True)
    await db.products.create_index('chronicle_number', unique=True)
    await db.products.create_index([('published', 1), ('chronicle_number', 1)])
    await db.products.create_index('images.id')
    await db.admin_users.create_index('id', unique=True)
    await db.admin_users.create_index('email', unique=True)
    await db.admin_sessions.create_index('id', unique=True)
    await db.admin_sessions.create_index('expires_at', expireAfterSeconds=0)
    await db.login_attempts.create_index('identifier', unique=True)
    await db.login_attempts.create_index('expires_at', expireAfterSeconds=0)
    await db.image_records.create_index('id', unique=True)
    await db.image_records.create_index('seed_key', unique=True, sparse=True)
    await db.image_records.create_index('created_at')
    await db.audit_events.create_index('created_at')