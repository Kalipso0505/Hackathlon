"""
GameMaster - The orchestrator agent for the murder mystery game.

Uses LangGraph to manage state and coordinate between personas.
"""

import os
import logging
from typing import Optional, TypedDict, Annotated
from operator import add

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END

# Setup logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class GameState(TypedDict):
    """State that is shared across the game session"""
    game_id: str
    messages: Annotated[list, add]  # Chat history accumulates
    revealed_clues: list[str]  # Clues the player has discovered
    current_persona: str  # Who is being talked to


class GameMaster:
    """
    Orchestrates the murder mystery game.
    
    Manages:
    - Game state (shared knowledge, revealed clues)
    - Persona interactions
    - Response generation via LangGraph
    """
    
    def __init__(self, scenario: dict, model_name: str = "gpt-4o-mini"):
        self.scenario = scenario
        self.model_name = model_name
        self.games: dict[str, dict] = {}  # Store game states
        
        # Initialize LLM
        self.llm = ChatOpenAI(
            model=model_name,
            temperature=0.8,  # Some creativity for natural responses
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Build persona lookup
        self.personas = {p["slug"]: p for p in scenario["personas"]}
    
    def start_game(self, game_id: str) -> dict:
        """Initialize a new game session"""
        self.games[game_id] = {
            "revealed_clues": [],
            "chat_history": {},  # Per-persona chat history
            "interrogation_count": {p: 0 for p in self.personas}
        }
        
        return {
            "game_id": game_id,
            "scenario_name": self.scenario["name"],
            "setting": self.scenario["setting"],
            "victim": f"{self.scenario['victim']['name']} ({self.scenario['victim']['role']})",
            "personas": [
                {
                    "slug": p["slug"],
                    "name": p["name"],
                    "role": p["role"],
                    "description": p["public_description"]
                }
                for p in self.scenario["personas"]
            ],
            "intro_message": self.scenario["intro_message"]
        }
    
    def _build_system_prompt(self, persona_slug: str, game_id: str) -> str:
        """Build the system prompt for a persona"""
        persona = self.personas[persona_slug]
        game = self.games.get(game_id, {})
        interrogation_count = game.get("interrogation_count", {}).get(persona_slug, 0)
        
        # Base personality and knowledge
        system_prompt = f"""Du bist {persona['name']}, {persona['role']} bei der InnoTech GmbH.

DEINE PERSÖNLICHKEIT:
{persona['personality']}

DEIN GEHEIMES WISSEN (verrate es nicht direkt, aber lass es durch dein Verhalten durchscheinen):
{persona['private_knowledge']}

WAS ALLE WISSEN:
{self.scenario['shared_knowledge']}

ZEITLINIE DES FALLS:
{self.scenario['timeline']}

WAS DU ÜBER ANDERE WEISST:
{persona['knows_about_others']}

WICHTIGE REGELN:
1. Bleibe IMMER in deiner Rolle als {persona['name']}
2. Antworte auf Deutsch
3. Halte Antworten kurz (2-4 Sätze), wie in einem echten Gespräch
4. Verrate deine Geheimnisse nie direkt, aber:
   - Zeige Nervosität oder Unbehagen bei heiklen Themen
   - Werde bei wiederholtem Nachfragen detaillierter
   - Mache kleine "Versprecher" die Hinweise geben
5. Wenn du nach anderen Personen gefragt wirst, nutze dein Wissen über sie
6. Du weißt NICHT wer der Mörder ist (außer du bist es selbst)
7. Beantworte nur was gefragt wird, erzähle nicht proaktiv alles

VERHALTENSHINWEISE NACH ANZAHL DER BEFRAGUNGEN:
- Bei den ersten Fragen: Sei zurückhaltend, gib Basisinformationen
- Nach 3+ Fragen: Werde etwas offener, zeige mehr Emotionen
- Nach 5+ Fragen: Bei Druck könntest du wichtige Details "versehentlich" erwähnen
"""
        
        # Add pressure based on interrogation count
        if interrogation_count > 5:
            system_prompt += f"\n\nDu wurdest jetzt schon {interrogation_count} mal befragt. Du wirst müde und unvorsichtiger."
        
        return system_prompt
    
    def _format_chat_history(self, chat_history: list[dict]) -> list:
        """Convert chat history to LangChain message format"""
        messages = []
        for msg in chat_history[-10:]:  # Keep last 10 messages for context
            if msg.get("role") == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg.get("role") == "assistant":
                messages.append(AIMessage(content=msg["content"]))
        return messages
    
    def _detect_revealed_clue(self, response: str, persona_slug: str) -> Optional[str]:
        """Check if the response reveals an important clue"""
        clue_keywords = {
            "tom": ["21:15", "zugangskarte", "sonntag", "abend", "trophäe", "hand", "schnitt"],
            "lisa": ["e-mail", "diebstahl", "geheimnisse", "streit am freitag"],
            "klaus": ["gesehen", "21", "blut", "flur"],
            "elena": ["investoren", "kontrolle", "streit mit marcus"]
        }
        
        response_lower = response.lower()
        revealed = []
        
        for keyword in clue_keywords.get(persona_slug, []):
            if keyword in response_lower:
                revealed.append(f"{persona_slug}: erwähnte '{keyword}'")
        
        return revealed[0] if revealed else None
    
    async def chat(
        self, 
        game_id: str, 
        persona_slug: str, 
        user_message: str,
        chat_history: list[dict]
    ) -> dict:
        """
        Send a message to a persona and get their response.
        
        This is where LangGraph would orchestrate the flow,
        but for the prototype we use a simpler direct approach.
        """
        # Ensure game exists
        if game_id not in self.games:
            self.start_game(game_id)
        
        game = self.games[game_id]
        persona = self.personas[persona_slug]
        
        # Increment interrogation count
        game["interrogation_count"][persona_slug] = \
            game["interrogation_count"].get(persona_slug, 0) + 1
        
        # Build messages for LLM
        system_prompt = self._build_system_prompt(persona_slug, game_id)
        messages = [SystemMessage(content=system_prompt)]
        
        # Add chat history
        messages.extend(self._format_chat_history(chat_history))
        
        # Add current user message
        messages.append(HumanMessage(content=user_message))
        
        # DEBUG: Log the full prompt
        logger.info(f"""
=== AGENT CALL DEBUG ===
Persona: {persona["name"]} ({persona_slug})
Interrogation Count: {game["interrogation_count"][persona_slug]}
User Message: {user_message}
System Prompt Length: {len(system_prompt)} chars
Full System Prompt:
{system_prompt}
========================
        """)
        
        # Get response from LLM
        response = await self.llm.ainvoke(messages)
        response_text = response.content
        
        # DEBUG: Log the response
        logger.info(f"""
=== AGENT RESPONSE ===
Persona: {persona["name"]}
Response: {response_text}
======================
        """)
        
        # Check for revealed clues
        revealed_clue = self._detect_revealed_clue(response_text, persona_slug)
        if revealed_clue and revealed_clue not in game["revealed_clues"]:
            game["revealed_clues"].append(revealed_clue)
        
        return {
            "persona_slug": persona_slug,
            "persona_name": persona["name"],
            "response": response_text,
            "revealed_clue": revealed_clue
        }
