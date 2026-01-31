"""
AI Service - Murder Mystery Game
FastAPI server that handles LangGraph multi-agent orchestration
"""

import os
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from agents.game_master import GameMaster
from scenarios.office_murder import OFFICE_MURDER_SCENARIO
from routes.debug import router as debug_router

# Load environment variables
load_dotenv()

# Validate OpenAI API key
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY environment variable is required")

# Initialize game master
game_master: Optional[GameMaster] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup"""
    global game_master
    game_master = GameMaster(
        scenario=OFFICE_MURDER_SCENARIO,
        model_name=os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    )
    yield
    # Cleanup on shutdown
    game_master = None


app = FastAPI(
    title="Murder Mystery AI Service",
    description="Multi-agent AI service for murder mystery games",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware for Laravel communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Laravel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include debug routes
app.include_router(debug_router, prefix="/debug", tags=["debug"])


# Request/Response models
class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    game_id: str
    persona_slug: str  # Which persona the user wants to talk to
    message: str
    chat_history: list[dict] = []  # Previous messages for context


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    persona_slug: str
    response: str
    persona_name: str
    revealed_clue: Optional[str] = None  # If persona accidentally reveals something


class GameStartRequest(BaseModel):
    """Request model for starting a new game"""
    game_id: str


class GameStartResponse(BaseModel):
    """Response model for game start"""
    game_id: str
    scenario_name: str
    setting: str
    victim: str
    personas: list[dict]
    intro_message: str


# Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "murder-mystery-ai"}


@app.post("/game/start", response_model=GameStartResponse)
async def start_game(request: GameStartRequest):
    """Initialize a new game session"""
    if not game_master:
        raise HTTPException(status_code=503, detail="Game master not initialized")
    
    game_info = game_master.start_game(request.game_id)
    return GameStartResponse(**game_info)


@app.post("/chat", response_model=ChatResponse)
async def chat_with_persona(request: ChatRequest):
    """Send a message to a specific persona"""
    if not game_master:
        raise HTTPException(status_code=503, detail="Game master not initialized")
    
    # Validate persona exists
    valid_personas = [p["slug"] for p in OFFICE_MURDER_SCENARIO["personas"]]
    if request.persona_slug not in valid_personas:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid persona. Choose from: {valid_personas}"
        )
    
    try:
        response = await game_master.chat(
            game_id=request.game_id,
            persona_slug=request.persona_slug,
            user_message=request.message,
            chat_history=request.chat_history
        )
        return ChatResponse(**response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/personas")
async def get_personas():
    """Get list of available personas"""
    return {
        "personas": [
            {
                "slug": p["slug"],
                "name": p["name"],
                "role": p["role"],
                "description": p["public_description"]
            }
            for p in OFFICE_MURDER_SCENARIO["personas"]
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
