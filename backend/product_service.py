import logging
from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4
from fastapi import HTTPException
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError
from database import db
from image_storage import image_public_record
from product_models import ProductOut

logger = logging.getLogger(__name__)


async def serialize_products(records):
    ids = list({image['id'] for product in records for image in product['images']})
    images = {item['id']: item async for item in db.image_records.find({'id': {'$in': ids}}, {'_id': 0})}
    result = []
    for record in records:
        media = []
        for ref in record['images']:
            if ref['id'] not in images:
                raise HTTPException(503, 'Product photography is temporarily unavailable')
            media.append({**ref, **image_public_record(images[ref['id']])})
        result.append(ProductOut(**{**record, 'price': format(Decimal(record['price_minor']) / 100, '.2f'), 'images': media}))
    return result


async def validate_images(refs):
    ids = [ref.id for ref in refs]
    count = await db.image_records.count_documents({'id': {'$in': ids}})
    if count != len(ids):
        raise HTTPException(422, 'One or more images no longer exist. Upload them again before saving.')


async def audit(admin, action, product_id):
    try:
        await db.audit_events.insert_one({'id': str(uuid4()), 'actor_id': admin['id'], 'action': action,
                                          'product_id': product_id, 'created_at': datetime.now(timezone.utc)})
    except Exception:
        logger.exception('Could not record catalogue audit event')


def write_fields(body):
    fields = body.model_dump(exclude={'version'})
    fields.pop('price')
    fields['price_minor'] = int(body.price * 100)
    fields['currency'] = 'INR'
    fields['updated_at'] = datetime.now(timezone.utc)
    return fields


async def create_product(body, admin):
    await validate_images(body.images)
    fields = write_fields(body)
    if fields['chronicle_number'] is None:
        counter = await db.counters.find_one_and_update({'_id': 'chronicle_number'}, {'$inc': {'value': 1}}, upsert=True,
                                                       return_document=ReturnDocument.AFTER, projection={'_id': 0})
        fields['chronicle_number'] = counter['value']
    record = {**fields, 'id': str(uuid4()), 'created_at': fields['updated_at'], 'version': 1}
    try:
        await db.products.insert_one(record.copy())
    except DuplicateKeyError:
        raise HTTPException(409, 'SKU or Chronicle number is already in use')
    await db.counters.update_one({'_id': 'chronicle_number'}, {'$max': {'value': fields['chronicle_number']}}, upsert=True)
    await audit(admin, 'product.created', record['id'])
    return (await serialize_products([record]))[0]


async def update_product(product_id, body, admin):
    existing = await db.products.find_one({'id': product_id}, {'_id': 0})
    if not existing:
        raise HTTPException(404, 'Product not found')
    await validate_images(body.images)
    fields = write_fields(body)
    fields['chronicle_number'] = fields['chronicle_number'] or existing['chronicle_number']
    try:
        updated = await db.products.find_one_and_update({'id': product_id, 'version': body.version},
            {'$set': fields, '$inc': {'version': 1}}, return_document=ReturnDocument.AFTER, projection={'_id': 0})
    except DuplicateKeyError:
        raise HTTPException(409, 'SKU or Chronicle number is already in use')
    if not updated:
        raise HTTPException(409, 'This product changed elsewhere. Reload it before saving to avoid overwriting newer changes.')
    await db.counters.update_one({'_id': 'chronicle_number'}, {'$max': {'value': fields['chronicle_number']}}, upsert=True)
    await audit(admin, 'product.updated', product_id)
    return (await serialize_products([updated]))[0]