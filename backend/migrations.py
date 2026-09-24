import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path
import httpx
from pymongo.errors import DuplicateKeyError
from starlette.concurrency import run_in_threadpool
from database import db
from image_storage import normalize_image, store_image


async def seed_catalogue():
    migration_id = 'initial-six-chronicles-v1'
    if await db.migrations.find_one({'_id': migration_id, 'complete': True}, {'_id': 0}):
        return
    records = json.loads((Path(__file__).parent / 'seed_products.json').read_text())
    async with httpx.AsyncClient(timeout=45, follow_redirects=True) as http:
        async def migrate(record):
            if await db.products.find_one({'id': record['id']}, {'_id': 0, 'id': 1}):
                return
            photo = await db.image_records.find_one({'seed_key': record['id']}, {'_id': 0})
            if not photo:
                response = await http.get(record['source_image'])
                response.raise_for_status()
                clean = await run_in_threadpool(normalize_image, response.content, 'image/jpeg', True)
                try:
                    photo = await store_image(*clean, created_by='catalogue-migration', seed_key=record['id'])
                except DuplicateKeyError:
                    photo = await db.image_records.find_one({'seed_key': record['id']}, {'_id': 0})
            product = {key: value for key, value in record.items() if key != 'source_image'}
            product.update({'images': [{'id': photo['id'], 'alt': record['name'], 'caption': ''}],
                            'stock_quantity': 0, 'published': True, 'currency': 'INR', 'version': 1,
                            'created_at': datetime.now(timezone.utc), 'updated_at': datetime.now(timezone.utc)})
            await db.products.update_one({'id': record['id']}, {'$setOnInsert': product}, upsert=True)
        await asyncio.gather(*(migrate(record) for record in records))
    await db.counters.update_one({'_id': 'chronicle_number'}, {'$max': {'value': 6}}, upsert=True)
    await db.migrations.update_one({'_id': migration_id}, {'$set': {'complete': True, 'completed_at': datetime.now(timezone.utc)}}, upsert=True)