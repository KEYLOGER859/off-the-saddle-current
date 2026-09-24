"""Storage boundary: replace this implementation for object storage without changing product image IDs."""
import hashlib
import io
import warnings
from datetime import datetime, timezone
from uuid import uuid4
from fastapi import HTTPException
from gridfs.errors import NoFile
from PIL import Image, ImageOps, UnidentifiedImageError
from database import db, image_bucket

MAX_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 24_000_000
FORMATS = {'JPEG': 'image/jpeg', 'PNG': 'image/png', 'WEBP': 'image/webp'}


def normalize_image(raw, declared, preserve_original=False):
    if not raw or len(raw) > MAX_BYTES:
        raise HTTPException(413, 'Each image must be non-empty and at most 10 MB')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(raw)) as probe:
                fmt, (width, height) = probe.format, probe.size
                if fmt not in FORMATS or declared not in (FORMATS.get(fmt), 'application/octet-stream'):
                    raise HTTPException(415, 'Upload a genuine JPEG, PNG or WebP photograph')
                if width * height > MAX_PIXELS or max(width, height) > 6000 or min(width, height) < 32:
                    raise HTTPException(413, 'Images must be 32–6000px per side, up to 24 megapixels')
                if getattr(probe, 'n_frames', 1) != 1:
                    raise HTTPException(415, 'Animated images are not supported')
                probe.verify()
        if preserve_original:
            return raw, FORMATS[fmt], width, height
        with Image.open(io.BytesIO(raw)) as source:
            image = ImageOps.exif_transpose(source)
            image = image.convert('RGBA' if fmt != 'JPEG' and 'A' in image.getbands() else 'RGB')
            width, height = image.size
            out = io.BytesIO()
            image.save(out, format=fmt, **({'quality': 92} if fmt in ('JPEG', 'WEBP') else {}))
            content = out.getvalue()
            if len(content) > MAX_BYTES:
                raise HTTPException(413, 'Normalized image exceeds 10 MB')
            return content, FORMATS[fmt], width, height
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, Image.DecompressionBombWarning, ValueError):
        raise HTTPException(415, 'Invalid or unsafe image')


async def store_image(content, mime, width, height, created_by, seed_key=None):
    image_id = str(uuid4())
    # String GridFS IDs avoid BSON IDs leaking into HTTP models.
    await image_bucket.upload_from_stream_with_id(image_id, image_id, content, metadata={'content_type': mime})
    record = {'id': image_id, 'storage_key': image_id, 'provider': 'gridfs', 'mime': mime,
              'width': width, 'height': height, 'bytes': len(content), 'sha256': hashlib.sha256(content).hexdigest(),
              'created_at': datetime.now(timezone.utc), 'created_by': created_by}
    if seed_key:
        record['seed_key'] = seed_key
    try:
        await db.image_records.insert_one(record.copy())
    except Exception:
        await image_bucket.delete(image_id)
        raise
    return record


async def remove_unreferenced_image(image_id):
    if await db.products.find_one({'images.id': image_id}, {'_id': 0, 'id': 1}):
        return False
    record = await db.image_records.find_one({'id': image_id}, {'_id': 0})
    if not record:
        return True
    try:
        await image_bucket.delete(record['storage_key'])
    except NoFile:
        pass
    await db.image_records.delete_one({'id': image_id})
    return True


def image_public_record(record):
    return {'id': record['id'], 'url': f"/api/images/{record['id']}", 'width': record['width'], 'height': record['height']}