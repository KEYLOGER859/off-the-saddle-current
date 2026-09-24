from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / '.env')

import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from database import client, create_indexes, db
from auth_routes import router as auth_router
from image_routes import router as image_router
from product_routes import router as product_router
from migrations import seed_catalogue

logging.basicConfig(level=logging.INFO)
origins = [origin.strip() for origin in os.environ['CORS_ORIGINS'].split(',') if origin.strip()]
if not origins or '*' in origins:
    raise RuntimeError('Explicit CORS origins are required for cookie-authenticated admin access')


@asynccontextmanager
async def lifespan(app):
    await db.command('ping')
    await create_indexes()
    await seed_catalogue()
    yield
    client.close()


app = FastAPI(title='OFF THE SADDLE — Catalogue API', lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True,
                   allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                   allow_headers=['Content-Type', 'X-CSRF-Token'])


@app.middleware('http')
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    if request.url.path.startswith('/api/admin'):
        response.headers['Cache-Control'] = 'no-store'
    return response


@app.get('/api/health')
async def health():
    await db.command('ping')
    return {'status': 'ok', 'service': 'catalogue', 'storage': 'mongodb-gridfs'}


app.include_router(auth_router)
app.include_router(product_router)
app.include_router(image_router)