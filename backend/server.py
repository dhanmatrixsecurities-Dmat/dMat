from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import httpx
import anthropic

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ─── EXISTING MODELS ────────────────────────────────────────

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class NotificationRequest(BaseModel):
    tokens: List[str]
    stockName: str
    type: str

# ─── KOOKY AI MODELS ────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str

class KookyRequest(BaseModel):
    messages: List[ChatMessage]
    user_id: Optional[str] = None

class KookyResponse(BaseModel):
    reply: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ─── EXISTING ROUTES ────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.post("/send-notification")
async def send_notification(request: NotificationRequest):
    messages = [
        {
            "to": token,
            "title": "New BUY Trade" if request.type == "BUY" else "New SELL Trade",
            "body": f"{request.stockName} - {request.type} signal added",
            "sound": "default"
        }
        for token in request.tokens
    ]
    async with httpx.AsyncClient() as http_client:
        response = await http_client.post(
            "https://exp.host/--/api/v2/push/send",
            json=messages,
            headers={"Content-Type": "application/json"}
        )
        result = response.json()
    return result

# ─── KOOKY AI ROUTE ─────────────────────────────────────────

KOOKY_SYSTEM_PROMPT = """You are Kooky, a sharp and knowledgeable AI finance agent built into the dMat trading app. You answer questions about:
- Stock market (NSE/BSE — Indian markets primarily)
- Trading strategies (intraday, swing, positional)
- Mutual funds and SIPs
- Portfolio management and allocation
- Technical analysis (RSI, MACD, Bollinger Bands, chart patterns)
- Fundamental analysis (P/E, EPS, PB ratio, debt-to-equity)
- IPOs, F&O, derivatives
- Crypto basics
- Personal finance and investing
- Market news and macroeconomics

When a user asks to analyze a stock, ALWAYS respond in this exact format:
📊 STOCK: [Stock Name]
─────────────────────
📈 TREND: Bullish / Neutral / Bearish
⚡ RISK LEVEL: Low / Medium / High

🏦 FUNDAMENTAL VIEW:
[2-3 lines on PE, revenue, valuation]

📉 TECHNICAL VIEW:
[RSI, support, resistance, moving averages]

🧠 KOOKY'S VERDICT:
[Clear, direct recommendation in 2 lines]

⚠️ Disclaimer: This is not SEBI-registered advice.

When a user shares their portfolio, ALWAYS respond in this format:
💼 PORTFOLIO ANALYSIS
─────────────────────
📊 DIVERSIFICATION SCORE: X/10
⚡ OVERALL RISK: Low / Medium / High

💪 STRONG HOLDINGS:
[List strong stocks]

⚠️ WEAK/RISKY HOLDINGS:
[List concerns]

🔄 REBALANCING SUGGESTIONS:
[Specific actionable advice]

⚠️ Disclaimer: This is not SEBI-registered advice.

Rules:
- Only answer finance, investing, trading, and money-related questions
- If asked anything unrelated, say: "I only operate in the money matrix."
- Be concise, sharp, and data-aware
- Speak like a smart trading desk analyst — direct, no fluff
- Never guarantee returns
- Always add disclaimer for specific stock tips"""

@api_router.post("/kooky", response_model=KookyResponse)
async def kooky_chat(request: KookyRequest):
    anthropic_client = anthropic.Anthropic(
        api_key=os.environ['ANTHROPIC_API_KEY']
    )

    anthropic_messages = [
        {"role": msg.role, "content": msg.content}
        for msg in request.messages
    ]

    # Save chat to MongoDB (optional — tracks usage)
    if request.user_id:
        await db.kooky_chats.insert_one({
            "user_id": request.user_id,
            "messages": [m.dict() for m in request.messages],
            "timestamp": datetime.utcnow()
        })

    response = anthropic_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=600,
        system=KOOKY_SYSTEM_PROMPT,
        messages=anthropic_messages,
    )

    return KookyResponse(reply=response.content[0].text)

# ─── APP SETUP ──────────────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
