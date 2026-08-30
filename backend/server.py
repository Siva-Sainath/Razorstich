from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import json
import asyncio
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone

try:
    from motor.motor_asyncio import AsyncIOMotorClient
except ImportError:  # theater runs without Mongo locally
    AsyncIOMotorClient = None

from case_data import (
    AMBIENT_EVENTS,
    CURRENT_CASE_ID,
    RECOVERY_AGENTS,
    build_queue,
    get_all_cases,
    get_case,
    get_default_case,
    recommend,
)
from agents_registry import list_agents
from learning_data import (
    get_featured_case,
    learning_summary,
    load_learning_manifest,
)
from milestone_rollout import rollout_milestone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB optional — theater APIs work without it locally
mongo_url = os.environ.get("MONGO_URL")
client = AsyncIOMotorClient(mongo_url) if (AsyncIOMotorClient and mongo_url) else None
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


class LeadCreate(BaseModel):
    email: str
    company: str
    volume: str = "<50k"
    uses_razorpay: bool = True
    note: str = ""
    plan: str = "pilot"
    referral_code: str | None = None
    referred_by: str | None = None
    utm: dict | None = None
    page: str | None = None


class VoiceSyncBody(BaseModel):
    prompt: str
    first_message: str = Field(default="", alias="firstMessage")

    model_config = ConfigDict(populate_by_name=True)


@api_router.post("/voice/pricing/sync")
async def sync_pricing_voice(body: VoiceSyncBody):
    """Push pricing voice prompt from frontend config to Smallest AI Atoms."""
    from smallest_ai import sync_pricing_voice_agent

    try:
        return sync_pricing_voice_agent(prompt=body.prompt, first_message=body.first_message)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        logger.exception("voice sync failed")
        raise HTTPException(status_code=502, detail=str(e)) from e


@api_router.get("/voice/pricing/config")
async def pricing_voice_config():
    """Public widget embed settings (no secrets)."""
    from smallest_ai import public_widget_config

    try:
        return public_widget_config()
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@api_router.post("/leads")
async def create_lead(body: LeadCreate):
    from leads_store import append_lead, lead_count
    import uuid as _uuid

    row = append_lead({**body.model_dump(), "id": f"lead_{_uuid.uuid4().hex[:10]}"})
    logger.info("lead captured: %s <%s> plan=%s", body.company, body.email, body.plan)
    return {"ok": True, "lead": row, "queue_position": lead_count()}


@api_router.get("/leads/stats")
async def lead_stats():
    from leads_store import lead_count

    return {"count": lead_count()}
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

@api_router.get("/wedges/catalog")
async def get_wedges_catalog():
    """Four wedge lanes — featured validation case + training summary per agent."""
    from learning_data import get_featured_case_id, learning_summary, research_catalog_meta

    catalog = []
    for wedge in RECOVERY_AGENTS:
        wid = wedge["id"]
        try:
            featured_id = get_featured_case_id(wid)
            summary = learning_summary(wid)
            b = summary.get("benchmark", {})
            baseline_b = summary.get("baseline_benchmark", {})
            catalog.append(
                {
                    "wedge": wid,
                    "name": wedge["name"],
                    "short_label": wedge["short_label"],
                    "featured_case_id": featured_id,
                    "anchor_case_id": summary["anchor_case_id"],
                    "window_hours": wedge["window_hours"],
                    "tick_hours": wedge["tick_hours"],
                    "max_steps": wedge["max_steps"],
                    "policy_version": wedge.get("policy_version"),
                    "training_curve": summary.get("training_curve", []),
                    "manifest": summary.get("manifest", []),
                    "hpo": summary.get("hpo", {}),
                    "baseline_benchmark": baseline_b,
                    "benchmark_full": b,
                    "benchmark": {
                        "policy_mean_net_inr": b.get("policy_mean_net_inr"),
                        "baseline_mean_net_inr": b.get("baseline_mean_net_inr"),
                        "seeds_beaten": b.get("seeds_beaten"),
                        "improvement_pct": b.get("acceptance", {}).get("mean_improvement_pct"),
                        "checkpoint": b.get("checkpoint"),
                        "policy_ci95": b.get("policy_ci95"),
                        "baseline_ci95": b.get("baseline_ci95"),
                        "policy_worst_seed_inr": b.get("policy_worst_seed_inr"),
                        "episodes_per_seed": b.get("episodes_per_seed"),
                        "seeds": b.get("seeds"),
                        "acceptance": b.get("acceptance"),
                    },
                }
            )
        except (ValueError, RuntimeError, KeyError):
            catalog.append({"wedge": wid, "name": wedge["name"], "error": "artifacts missing"})
    return {"wedges": catalog, "meta": research_catalog_meta()}


@api_router.get("/agents")
async def get_agents():
    """Four trained recovery agents — one Dueling DDQN per wedge."""
    return {"agents": list_agents()}


@api_router.get("/case/current")
async def get_current_case():
    """Featured flagship case — DQN rollout from validation scenario."""
    return get_default_case()


@api_router.get("/case/featured")
async def get_featured(wedge: str = "checkout_failed"):
    try:
        return get_featured_case(wedge)
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@api_router.get("/case/{case_id}")
async def get_case_by_id(case_id: str):
    """Load any validation-scenario case by id."""
    payload = get_case(case_id)
    if payload is None:
        raise HTTPException(
            status_code=404,
            detail={"error": "case not found", "available": sorted(get_all_cases().keys())},
        )
    return payload


class PolicyRequest(BaseModel):
    tick: int = 0
    contacts_used: int = 0
    method: str = "card"
    hours_since_failure: float = 0.0
    wedge: str = "checkout_failed"
    case_id: str | None = None
    amount_inr: float | None = None
    failure_reason: str | None = None


@api_router.post("/policy/recommend")
async def policy_recommend(req: PolicyRequest):
    """Dueling DDQN recommendation — routes to the correct wedge agent."""
    return recommend(
        req.tick,
        req.contacts_used,
        req.method,
        req.hours_since_failure,
        wedge=req.wedge,
        case_id=req.case_id,
        amount_inr=req.amount_inr,
        failure_reason=req.failure_reason,
    )


@api_router.get("/cases/queue")
async def get_case_queue(current: str | None = Query(None, alias="current")):
    """All validation-scenario cases across the four recovery agents."""
    current_id = current or CURRENT_CASE_ID
    if current and get_case(current_id) is None:
        raise HTTPException(status_code=404, detail=f"unknown case id: {current_id}")
    return {"cases": build_queue(current_id), "agents": RECOVERY_AGENTS}


@api_router.get("/learn/summary")
async def get_learning_summary(wedge: str = "checkout_failed"):
    try:
        return learning_summary(wedge)
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@api_router.get("/learn/milestone/{episode}")
async def get_learning_milestone(
    episode: int,
    wedge: str = "checkout_failed",
    case_id: str | None = Query(None),
):
    try:
        manifest = load_learning_manifest(wedge)
        if not any(row["episode"] == episode for row in manifest):
            raise FileNotFoundError(f"milestone episode {episode} is not available")
        summary = learning_summary(wedge)
        anchor = case_id or summary["anchor_case_id"]
        return rollout_milestone(wedge, episode, anchor)
    except (ValueError, KeyError, FileNotFoundError, RuntimeError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@api_router.get("/learn/compare")
async def compare_learning(wedge: str = "checkout_failed"):
    try:
        summary = learning_summary(wedge)
        benchmark = summary["benchmark"]
        return {
            "wedge": wedge,
            "case_id": summary["anchor_case_id"],
            "policy": {
                "mean_net_inr": benchmark.get("policy_mean_net_inr"),
                "ci95": benchmark.get("policy_ci95"),
            },
            "baseline": {
                "mean_net_inr": benchmark.get("baseline_mean_net_inr"),
                "ci95": benchmark.get("baseline_ci95"),
            },
            "seeds_beaten": benchmark.get("seeds_beaten"),
            "acceptance": benchmark.get("acceptance", {}),
        }
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


class RazorpayTestPayBody(BaseModel):
    card_number: str
    amount_inr: float = 1499.0
    wedge: str = "checkout_failed"
    method: str = "card"


@api_router.get("/razorpay/test/cards")
async def razorpay_test_cards():
    """Official Razorpay test card catalog for sandbox checkout (no live PG keys)."""
    from razorpay_test import list_test_cards

    return {"test_mode": True, "cards": list_test_cards()}


@api_router.post("/razorpay/test/pay")
async def razorpay_test_pay(body: RazorpayTestPayBody):
    """Simulate Razorpay Test Mode payment with test cards → policy recommend on failure."""
    from razorpay_test import simulate_test_payment

    try:
        return simulate_test_payment(
            card_number=body.card_number,
            amount_inr=body.amount_inr,
            wedge=body.wedge,
            method=body.method,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@api_router.get("/razorpay/test/audit")
async def razorpay_test_audit(limit: int = Query(20, ge=1, le=100)):
    from razorpay_test import get_audit_log

    return {"test_mode": True, "entries": get_audit_log(limit)}


@api_router.post("/webhooks/razorpay")
async def razorpay_webhook_stub():
    """
    Webhook placeholder for Razorpay Test Mode dashboard.
    Use POST /api/razorpay/test/pay for interactive sandbox without keys.
    """
    return {
        "ok": True,
        "test_mode": True,
        "message": "Use /sandbox for Razorpay test card checkout, or POST /api/razorpay/test/pay",
    }


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