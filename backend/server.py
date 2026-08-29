from fastapi import FastAPI, APIRouter
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import asyncio
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone

from case_data import CASE_PAYLOAD, AMBIENT_EVENTS, recommend, QUEUE_CASES


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB optional — theater APIs work without it locally
mongo_url = os.environ.get("MONGO_URL")
client = AsyncIOMotorClient(mongo_url) if mongo_url else None
db = client[os.environ.get("DB_NAME", "razorstitch")] if client else None

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    if db is not None:
        doc = status_obj.model_dump()
        doc["timestamp"] = doc["timestamp"].isoformat()
        await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    if db is None:
        return []
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@api_router.get("/case/current")
async def get_current_case():
    """Full mock case narrative for the RazorStitch recovery console."""
    return CASE_PAYLOAD


class PolicyRequest(BaseModel):
    tick: int = 0
    contacts_used: int = 0
    method: str = "card"
    hours_since_failure: float = 0.0


@api_router.post("/policy/recommend")
async def policy_recommend(req: PolicyRequest):
    """Dueling DDQN recommendation (real weights via policy_bridge, mock fallback)."""
    return recommend(req.tick, req.contacts_used, req.method, req.hours_since_failure)


@api_router.get("/cases/queue")
async def get_case_queue():
    """Other failing payments the agent is working (mock queue)."""
    return {"cases": QUEUE_CASES}


@api_router.get("/events/stream")
async def stream_events():
    """Mock SSE stream of ambient ops events for the live ticker."""

    async def event_generator():
        i = 0
        # initial burst so the ticker feels alive immediately
        try:
            while True:
                base = AMBIENT_EVENTS[i % len(AMBIENT_EVENTS)]
                payload = {
                    **base,
                    "id": str(uuid.uuid4()),
                    "seq": i,
                    "ts": datetime.now(timezone.utc).isoformat(),
                }
                yield f"data: {json.dumps(payload)}\n\n"
                i += 1
                await asyncio.sleep(1.0 if i < 4 else 2.6)
        except asyncio.CancelledError:
            return

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    if client is not None:
        client.close()