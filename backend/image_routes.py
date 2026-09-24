from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from gridfs.errors import NoFile
from starlette.concurrency import run_in_threadpool
from auth_security import require_admin, require_admin_write
from database import db, image_bucket
from image_storage import MAX_BYTES, image_public_record, normalize_image, remove_unreferenced_image, store_image

router = APIRouter(prefix='/api', tags=['Product images'])


class UploadedImage(BaseModel):
    id: str
    url: str
    width: int
    height: int


class UploadedImages(BaseModel):
    images: list[UploadedImage]


@router.post('/admin/images', response_model=UploadedImages, status_code=201)
async def upload(files: list[UploadFile] = File(...), admin=Depends(require_admin_write)):
    if not 1 <= len(files) <= 8:
        raise HTTPException(400, 'Upload 1–8 images at a time')
    made = []
    try:
        for file in files:
            raw = await file.read(MAX_BYTES + 1)
            await file.close()
            clean = await run_in_threadpool(normalize_image, raw, file.content_type)
            made.append(await store_image(*clean, created_by=admin['id']))
        return UploadedImages(images=[UploadedImage(**image_public_record(record)) for record in made])
    except Exception:
        for record in made:
            await remove_unreferenced_image(record['id'])
        raise
    finally:
        for file in files:
            await file.close()


@router.get('/images/{image_id}')
async def serve_image(image_id: str, request: Request):
    record = await db.image_records.find_one({'id': image_id}, {'_id': 0})
    if not record:
        raise HTTPException(404, 'Image not found')
    published = await db.products.find_one({'images.id': image_id, 'published': True}, {'_id': 0, 'id': 1})
    if not published:
        await require_admin(request)
    headers = {'ETag': f'"{record["sha256"]}"', 'X-Content-Type-Options': 'nosniff',
               'Cache-Control': 'public, max-age=3600' if published else 'private, no-store'}
    if request.headers.get('if-none-match') == headers['ETag']:
        return Response(status_code=304, headers=headers)
    try:
        stream = await image_bucket.open_download_stream(record['storage_key'])
    except NoFile:
        raise HTTPException(404, 'Image content not found')
    async def chunks():
        try:
            while chunk := await stream.read(255 * 1024):
                yield chunk
        finally:
            await stream.close()
    return StreamingResponse(chunks(), media_type=record['mime'], headers={**headers, 'Content-Length': str(record['bytes'])})


@router.delete('/admin/images/{image_id}', status_code=204)
async def delete_image(image_id: str, admin=Depends(require_admin_write)):
    if not await remove_unreferenced_image(image_id):
        raise HTTPException(409, 'This image is still attached to a product. Remove it from the product and save first.')