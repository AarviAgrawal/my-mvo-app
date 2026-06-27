from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import analysis, decisions, import_data

app = FastAPI(
    title='MadMix Insights API',
    version='1.0.0',
    description='Backend for the MadMix Insights Portal — analytics, decisions engine, and data import.',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'DELETE', 'OPTIONS'],
    allow_headers=['Authorization', 'Content-Type'],
)

app.include_router(analysis.router, prefix='/api/v1', tags=['analysis'])
app.include_router(decisions.router, prefix='/api/v1', tags=['decisions'])
app.include_router(import_data.router, prefix='/api/v1', tags=['import'])


@app.get('/health', tags=['health'])
def health_check():
    return {'status': 'ok', 'service': 'madmix-insights-api', 'version': '1.0.0'}
