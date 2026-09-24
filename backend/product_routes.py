import re
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from auth_security import require_admin, require_admin_write
from database import db
from product_models import ProductOut, ProductPage, ProductUpdate, ProductWrite
from product_service import audit, create_product, serialize_products, update_product

router = APIRouter(prefix='/api', tags=['Products'])


async def page_of_products(query, page, page_size):
    total = await db.products.count_documents(query)
    rows = await db.products.find(query, {'_id': 0}).sort('chronicle_number', 1).skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return ProductPage(items=await serialize_products(rows), total=total, page=page,
                       page_size=page_size, has_more=page * page_size < total)


@router.get('/products', response_model=ProductPage)
async def public_products(response: Response, page: int = Query(1, ge=1), page_size: int = Query(100, ge=1, le=100)):
    response.headers['Cache-Control'] = 'no-store'
    return await page_of_products({'published': True}, page, page_size)


@router.get('/products/{product_id}', response_model=ProductOut)
async def public_product(product_id: str, response: Response):
    record = await db.products.find_one({'id': product_id, 'published': True}, {'_id': 0})
    if not record:
        raise HTTPException(404, 'Product not found')
    response.headers['Cache-Control'] = 'no-store'
    return (await serialize_products([record]))[0]


@router.get('/admin/products', response_model=ProductPage)
async def admin_products(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
                         search: str = Query('', max_length=100), status: Literal['all', 'published', 'draft'] = 'all', admin=Depends(require_admin)):
    query = {}
    if status != 'all':
        query['published'] = status == 'published'
    if search.strip():
        pattern = {'$regex': re.escape(search.strip()), '$options': 'i'}
        query['$or'] = [{'name': pattern}, {'sku': pattern}]
    return await page_of_products(query, page, page_size)


@router.get('/admin/products/{product_id}', response_model=ProductOut)
async def admin_product(product_id: str, admin=Depends(require_admin)):
    record = await db.products.find_one({'id': product_id}, {'_id': 0})
    if not record:
        raise HTTPException(404, 'Product not found')
    return (await serialize_products([record]))[0]


@router.post('/admin/products', response_model=ProductOut, status_code=201)
async def create(body: ProductWrite, admin=Depends(require_admin_write)):
    return await create_product(body, admin)


@router.put('/admin/products/{product_id}', response_model=ProductOut)
async def update(product_id: str, body: ProductUpdate, admin=Depends(require_admin_write)):
    return await update_product(product_id, body, admin)


@router.delete('/admin/products/{product_id}', status_code=204)
async def delete(product_id: str, version: int = Query(..., ge=1), admin=Depends(require_admin_write)):
    result = await db.products.delete_one({'id': product_id, 'version': version})
    if not result.deleted_count:
        exists = await db.products.find_one({'id': product_id}, {'_id': 0, 'id': 1})
        raise HTTPException(409 if exists else 404, 'Product changed elsewhere. Reload before deleting.' if exists else 'Product not found')
    # Image records are intentionally retained until explicitly deleted or orphan
    # cleanup runs, so a concurrent edit cannot silently lose its uploaded media.
    await audit(admin, 'product.deleted', product_id)