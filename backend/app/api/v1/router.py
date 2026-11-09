"""BlogNexa AI - API v1 Router Aggregator."""

from fastapi import APIRouter
from backend.app.api.v1.endpoints import enrollment, site, jobs, knowledge
from backend.app.modules.crawler.api.router import router as crawler_router


api_router = APIRouter()

api_router.include_router(enrollment.router, prefix="/enrollment", tags=["enrollment"])
api_router.include_router(site.router, prefix="/site", tags=["site"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
api_router.include_router(crawler_router, tags=["crawler"])
