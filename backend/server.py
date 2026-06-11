from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import re
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Any
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

# ─── MODELS ──────────────────────────────────────────────────────────────────

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

class ChatMessage(BaseModel):
    role: str
    content: str

class KookyRequest(BaseModel):
    messages: List[ChatMessage]
    user_id: Optional[str] = None

class HoldingItem(BaseModel):
    name: str
    qty: str

class PortfolioRequest(BaseModel):
    holdings: List[HoldingItem]
    user_id: Optional[str] = None

# ─── EXISTING ROUTES ─────────────────────────────────────────────────────────

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
            "sound": "default",
            "priority": "high",
            "channelId": "default",
            "data": {"type": request.type, "stockName": request.stockName},
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

# ─── KOOKY SYSTEM PROMPT ─────────────────────────────────────────────────────

KOOKY_SYSTEM_PROMPT = """You are Kooky, an AI market education assistant inside the DhanMatrix app for Indian retail investors.

STRICT RULES — NEVER BREAK:
- NEVER use: buy, sell, purchase, entry, exit, trade signal, target price, stop loss, recommendation
- Use instead: positive, favourable, watch, caution, constructive, healthy, moderate
- Always say this is for education & research only — not investment advice
- Always recommend consulting a SEBI-registered advisor
- Only answer questions about: Indian stock market, trading concepts, mutual funds, bonds, SIPs, technical analysis, fundamental analysis, IPOs, F&O, portfolio analysis, personal finance
- For ANYTHING else reply: "I only operate in the stock market world. Ask me about stocks, trading, mutual funds, or your portfolio."

RESPONSE RULES:
When user asks to ANALYZE a specific stock (detect: "analyze", "analysis of", "check", "tell me about" + stock name):
→ Return ONLY valid JSON. No markdown. No text outside JSON:
{
  "type": "analysis",
  "stockName": "Full Company Name",
  "exchange": "NSE: SYMBOL · Sector",
  "price": "₹X,XXX",
  "change": "X.XX%",
  "changeDir": "up",
  "financials": {
    "revenueGrowth": { "label": "Revenue growth", "value": "Healthy", "tag": "green", "note": "Short note max 8 words" },
    "profitability":  { "label": "Profitability",  "value": "Stable",  "tag": "green", "note": "Short note max 8 words" },
    "debtPosition":   { "label": "Debt position",  "value": "Moderate","tag": "amber", "note": "Short note max 8 words" },
    "valuation":      { "label": "Valuation",       "value": "Not cheap","tag": "amber","note": "Short note max 8 words" },
    "bars": [
      { "label": "Revenue YoY", "value": "+8%",  "pct": 75, "color": "#22C55E" },
      { "label": "Profit YoY",  "value": "+11%", "pct": 70, "color": "#22C55E" },
      { "label": "Debt/Equity", "value": "0.42", "pct": 42, "color": "#F59E0B" }
    ]
  },
  "events": [
    { "tag": "Qtr\nResult", "name": "Earnings announcement",  "detail": "Short detail max 10 words", "impact": "High"   },
    { "tag": "Board\nMeet", "name": "Corporate updates",      "detail": "Short detail max 10 words", "impact": "High"   },
    { "tag": "Sector\nNews","name": "Relevant sector events", "detail": "Short detail max 10 words", "impact": "Medium" },
    { "tag": "Macro\nRBI",  "name": "Monetary policy review", "detail": "Short detail max 10 words", "impact": "Medium" }
  ],
  "indicators": [
    { "name": "RSI (14)",   "value": "58.3",   "signal": "Positive",   "note": "Momentum strengthening"  },
    { "name": "MACD",       "value": "+14.2",  "signal": "Favourable", "note": "Signal crossover active"  },
    { "name": "50-day MA",  "value": "₹2,812", "signal": "Positive",   "note": "Short-term trend intact"  },
    { "name": "200-day MA", "value": "₹2,641", "signal": "Positive",   "note": "Long-term trend intact"   },
    { "name": "Volume",     "value": "+38%",   "signal": "Positive",   "note": "Conviction behind move"   },
    { "name": "Stochastic", "value": "71.4",   "signal": "Watch",      "note": "Approaching upper zone"   }
  ],
  "support": {
    "resistance2": "₹3,120",
    "resistance1": "₹2,980",
    "current":     "₹2,934",
    "support1":    "₹2,820",
    "support2":    "₹2,680"
  },
  "report": {
    "zone":      "green",
    "score":     72,
    "signal":    "Green zone — positive picture",
    "signalSub": "Most indicators aligned favourably",
    "insight":   "2-3 sentences education-only, no recommendations. Mention what to watch.",
    "longTerm":  "2 sentences on 3-5 year research perspective only. Never a recommendation.",
    "scorecard": [
      { "label": "Financials", "filled": 4, "color": "#22C55E" },
      { "label": "Event risk", "filled": 2, "color": "#F59E0B" },
      { "label": "Technical",  "filled": 4, "color": "#22C55E" },
      { "label": "Long-term",  "filled": 4, "color": "#2979FF" }
    ]
  }
}

tag values: "green" | "amber" | "red"
signal values: "Positive" | "Favourable" | "Watch" | "Caution" | "Neutral"
zone values: "green" | "amber" | "red"
score: 0-100 integer
changeDir: "up" | "down"

For ALL other questions:
→ Return: { "type": "text", "reply": "your answer here" }

Use realistic approximate Indian market data. Keep all strings concise. No markdown inside JSON."""

# ─── PORTFOLIO SYSTEM PROMPT ──────────────────────────────────────────────────

PORTFOLIO_SYSTEM_PROMPT = """You are Kooky, an AI market education assistant inside DhanMatrix.
Analyse the given stock portfolio using institutional frameworks (SEBI guidelines, modern portfolio theory, diversification standards).

STRICT RULES:
- NEVER say: buy, sell, invest, hold, exit, target, stop loss, recommendation
- Always frame as: analysis, observation, education, research only
- Language must be simple for a first-time Indian retail investor
- Always end with SEBI advisor disclaimer

Return ONLY valid JSON. No markdown. No text outside JSON:
{
  "type": "portfolio",
  "totalValue": 100000,
  "returnPct": 10.2,
  "zone": "amber",
  "zoneLabel": "Moderate",
  "score": 66,
  "scoreLabel": "Moderate health",
  "scoreSubtitle": "Good stock quality. Structure has gaps.",
  "chips": [
    { "label": "Quality picks",   "type": "green" },
    { "label": "Beating NIFTY",   "type": "green" },
    { "label": "50% in 1 stock",  "type": "amber" },
    { "label": "No debt / bonds", "type": "red"   }
  ],
  "kookyTake": "One punchy sentence about the portfolio in plain simple English. Max 30 words.",
  "holdings": [
    {
      "symbol": "RELIANCE",
      "name": "Reliance Industries",
      "sector": "Energy",
      "cap": "Large cap",
      "value": 50000,
      "returnPct": 9.4,
      "weight": 50,
      "weightLabel": "too heavy",
      "weightColor": "amber",
      "pe": "26.4x", "roe": "9.8%", "de": "0.42",
      "peColor": "green", "roeColor": "amber", "deColor": "amber",
      "logoColor": "#0A2A4A", "logoText": "RL", "logoTextColor": "#60A5FA"
    }
  ],
  "metrics": {
    "totalValueFmt": "₹1.0L",
    "returnFmt": "+10.2%",
    "returnVsNifty": "vs NIFTY +9.8%",
    "beta": "1.12",        "betaNote": "Moves 12% more than market",       "betaSub": "If NIFTY falls 10%, yours may fall ~11-12%",
    "sharpe": "1.38",      "sharpeNote": "Good return for the risk",        "sharpeSub": "Above 1.0 is considered healthy",
    "maxDrawdown": "-21%", "drawdownNote": "Worst fall so far",             "drawdownSub": "Your portfolio fell this much at its worst",
    "var95": "-7.8%",      "varNote": "Monthly risk estimate",              "varSub": "95% chance you won't lose more than this in a month"
  },
  "benchmarks": [
    { "name": "Your portfolio", "value": "+10.2%", "pct": 64, "color": "#2979FF", "valColor": "#22C55E" },
    { "name": "NIFTY 50",      "value": "+9.8%",  "pct": 50, "color": "#4A6A8A", "valColor": "#4A9EFF" },
    { "name": "SENSEX",        "value": "+8.9%",  "pct": 44, "color": "#2E4060", "valColor": "#4A6A8A" }
  ],
  "healthBars": [
    { "label": "Stock quality",   "pct": 88, "color": "#22C55E" },
    { "label": "Returns",         "pct": 72, "color": "#2979FF" },
    { "label": "Risk management", "pct": 55, "color": "#F59E0B" },
    { "label": "Diversification", "pct": 42, "color": "#F59E0B" },
    { "label": "Asset class mix", "pct": 30, "color": "#EF4444" }
  ],
  "observations": [
    { "type": "green", "title": "Short title", "body": "2 sentences plain English. Real numbers. No jargon." },
    { "type": "amber", "title": "Short title", "body": "2 sentences plain English. Real numbers. No jargon." },
    { "type": "red",   "title": "Short title", "body": "2 sentences plain English. Real numbers. No jargon." }
  ],
  "nextSteps": [
    { "head": "Short action title", "desc": "What to research. Plain English. No recommendations." },
    { "head": "Short action title", "desc": "What to research. Plain English. No recommendations." },
    { "head": "Talk to a SEBI advisor", "desc": "Kooky gives you the framework. A registered advisor applies it to your actual goals." }
  ],
  "longTerm": "2 sentences. 3-5 year educational perspective only. No recommendations."
}

zone: "green" | "amber" | "red"
chip type: "green" | "amber" | "red"
weightColor/peColor/roeColor/deColor: "green" | "amber" | "red"
obs type: "green" | "amber" | "red"
score: 0-100 integer
All values must be realistic for Indian markets."""

# ─── KOOKY CHAT ROUTE ────────────────────────────────────────────────────────

@api_router.post("/kooky")
async def kooky_chat(request: KookyRequest):
    anthropic_client = anthropic.Anthropic(
        api_key=os.environ['ANTHROPIC_API_KEY']
    )

    anthropic_messages = [
        {"role": msg.role, "content": msg.content}
        for msg in request.messages
    ]

    # Save chat to MongoDB
    if request.user_id:
        await db.kooky_chats.insert_one({
            "user_id": request.user_id,
            "messages": [m.dict() for m in request.messages],
            "timestamp": datetime.utcnow()
        })

    response = anthropic_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        system=KOOKY_SYSTEM_PROMPT,
        messages=anthropic_messages,
    )

    raw = response.content[0].text.strip()

    # Try to parse as JSON first (analysis or text type)
    try:
        clean = re.sub(r'^```json\s*', '', raw)
        clean = re.sub(r'^```\s*', '', clean)
        clean = re.sub(r'\s*```$', '', clean).strip()
        parsed = json.loads(clean)
        return parsed
    except Exception:
        # Fallback — return as plain text reply
        return {"type": "text", "reply": raw}


# ─── KOOKY PORTFOLIO ROUTE ───────────────────────────────────────────────────

@api_router.post("/kooky-portfolio")
async def kooky_portfolio(request: PortfolioRequest):
    anthropic_client = anthropic.Anthropic(
        api_key=os.environ['ANTHROPIC_API_KEY']
    )

    holdings_list = "\n".join(
        [f"- {h.name}: {h.qty}" for h in request.holdings]
    )
    user_msg = f"Analyse this portfolio:\n{holdings_list}\n\nProvide full analysis JSON."

    # Save to MongoDB
    if request.user_id:
        await db.kooky_portfolio_requests.insert_one({
            "user_id": request.user_id,
            "holdings": [h.dict() for h in request.holdings],
            "timestamp": datetime.utcnow()
        })

    response = anthropic_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=3000,
        system=PORTFOLIO_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )

    raw = response.content[0].text.strip()

    try:
        clean = re.sub(r'^```json\s*', '', raw)
        clean = re.sub(r'^```\s*', '', clean)
        clean = re.sub(r'\s*```$', '', clean).strip()
        parsed = json.loads(clean)
        return parsed
    except Exception:
        return {"type": "text", "reply": "Could not analyse portfolio. Please try again."}


# ─── APP SETUP ───────────────────────────────────────────────────────────────

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
