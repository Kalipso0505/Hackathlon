"""
Scenario Generator Service

Generates new murder mystery scenarios using GPT-4 with Structured Output.
Uses Pydantic models for guaranteed valid JSON output - no parsing errors!

OPTIMIZATION: Two-phase generation with parallel persona creation:
1. Generate base scenario with persona blueprints (fast)
2. Generate all 4 personas in parallel (4x faster than sequential)

Prompts are loaded from the Laravel database via PromptService.
"""

import os
import asyncio
import logging

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel, Field

from .prompt_service import get_prompt_service

logger = logging.getLogger(__name__)


# === Pydantic Models for Structured Output ===

class VictimModel(BaseModel):
    """The murder victim"""
    name: str = Field(description="Full name of the victim")
    role: str = Field(description="Job title or role")
    description: str = Field(description="Brief description: age, background, personality")


class SolutionModel(BaseModel):
    """The solution to the mystery"""
    murderer: str = Field(description="Slug of the murderer (lowercase, must match a persona slug)")
    motive: str = Field(description="Detailed motive: why did they kill?")
    weapon: str = Field(description="Murder weapon and method")
    critical_clues: list[str] = Field(description="3+ clues that point to the murderer", min_length=3)


class PersonaBlueprintModel(BaseModel):
    """Brief persona blueprint for parallel generation"""
    slug: str = Field(description="Unique ID: lowercase, no umlauts (e.g., 'elena', 'tom')")
    name: str = Field(description="Full name")
    role: str = Field(description="Job title or relationship to victim")
    public_description: str = Field(description="What everyone knows (1 sentence)")
    is_murderer: bool = Field(description="True if this persona is the murderer")
    secret_summary: str = Field(description="Brief summary of their key secrets and alibi (2-3 sentences)")


class BaseScenarioModel(BaseModel):
    """Base scenario without full persona details (Phase 1)"""
    name: str = Field(description="Case name, e.g., 'Der Fall Villa Rosenberg'")
    setting: str = Field(description="2-3 paragraphs: Where? When? What happened? How was the body found?")
    victim: VictimModel
    solution: SolutionModel
    shared_knowledge: str = Field(description="Bullet points of facts everyone knows")
    timeline: str = Field(description="Timeline of events with times")
    persona_blueprints: list[PersonaBlueprintModel] = Field(description="4+ suspect blueprints", min_length=4)
    intro_message: str = Field(description="Welcome message introducing the case to the player")


class PersonaModel(BaseModel):
    """Full persona details (Phase 2 - generated in parallel)"""
    slug: str = Field(description="Unique ID: lowercase, no umlauts (e.g., 'elena', 'tom')")
    name: str = Field(description="Full name")
    role: str = Field(description="Job title or relationship to victim")
    public_description: str = Field(description="What everyone knows about this person (1 sentence)")
    personality: str = Field(description="How they speak, behave, react to pressure (2-3 sentences)")
    private_knowledge: str = Field(description="Their secrets, alibi, observations, motives. For the murderer: include 'DU BIST DER MÖRDER' and full confession details")
    knows_about_others: str = Field(description="What they know about other suspects (format: '- Name: knowledge')")


class ScenarioModel(BaseModel):
    """Complete murder mystery scenario (legacy - for non-parallel mode)"""
    name: str = Field(description="Case name, e.g., 'Der Fall Villa Rosenberg'")
    setting: str = Field(description="2-3 paragraphs: Where? When? What happened? How was the body found?")
    victim: VictimModel
    solution: SolutionModel
    shared_knowledge: str = Field(description="Bullet points of facts everyone knows")
    timeline: str = Field(description="Timeline of events with times")
    personas: list[PersonaModel] = Field(description="4+ suspects (one is the murderer)", min_length=4)
    intro_message: str = Field(description="Welcome message introducing the case to the player")


# === Prompts ===

BASE_SCENARIO_PROMPT = """Du bist ein kreativer Autor für Murder Mystery Spiele.

Erstelle das GRUNDGERÜST eines Mordfall-Szenarios auf Deutsch.
Die vollständigen Persona-Details werden separat generiert.

## Deine Aufgabe:
1. Erstelle Setting, Opfer, Lösung, Timeline
2. Erstelle BLUEPRINTS für 4+ Verdächtige (einer ist Mörder)
3. Für jeden Blueprint: Name, Rolle, kurze Geheimniszusammenfassung

## Regeln:
- Logisch konsistent (Alibis, Zeiten müssen passen)
- Der Mörder muss überführbar sein
- Kreative Settings (Weingut, Kreuzfahrt, Theater, Museum...)

## Schwierigkeitsgrade:
- EINFACH: Offensichtliche Hinweise
- MITTEL: Gemischte Hinweise
- SCHWER: Versteckte Hinweise"""

PERSONA_PROMPT = """Du bist ein Charakterautor für Murder Mystery Spiele.

Erstelle die VOLLSTÄNDIGEN Details für diese Person basierend auf dem Szenario.

## Szenario-Kontext:
{scenario_context}

## Andere Verdächtige:
{other_personas}

## Deine Aufgabe - Erstelle Details für:
Name: {persona_name}
Rolle: {persona_role}
Ist Mörder: {is_murderer}
Geheimnis-Zusammenfassung: {secret_summary}

## Regeln:
- personality: Wie spricht/verhält sich die Person? (2-3 Sätze)
- private_knowledge: Alle Geheimnisse, Alibi, Beobachtungen
- knows_about_others: Was weiß diese Person über die anderen? (- Name: Wissen)

{murderer_instructions}"""

MURDERER_INSTRUCTIONS = """
## WICHTIG - Diese Person ist DER MÖRDER!
private_knowledge MUSS enthalten:
- "DU BIST DER MÖRDER" am Anfang
- Vollständiger Tathergang (Planung, Durchführung, Vertuschung)
- Welche Spuren wurden hinterlassen
- Psychologischer Zustand (Schuld, Angst, Rechtfertigung)

Schwierigkeit {difficulty}:
- EINFACH: Nervös, knickt schnell ein, zeigt Schuldgefühle
- MITTEL: Kontrolliert aber macht Fehler unter Druck  
- SCHWER: Perfekter Lügner, nur durch Logik überführbar"""

INNOCENT_INSTRUCTIONS = """
## Diese Person ist UNSCHULDIG
private_knowledge sollte enthalten:
- Eigene Geheimnisse (die verdächtig wirken können)
- Alibi zur Tatzeit
- Beobachtungen (was haben sie gesehen/gehört?)
- Beziehung zum Opfer"""


class ScenarioGenerator:
    """
    Generates murder mystery scenarios using AI with Structured Output.
    
    Uses two-phase parallel generation:
    1. Generate base scenario with persona blueprints
    2. Generate all 4 personas in PARALLEL (4x faster!)
    
    Uses Pydantic models to guarantee valid JSON - eliminates parsing errors.
    """
    
    def __init__(self, model_name: str = "gpt-4o-mini"):
        self.model_name = model_name
        self.api_key = os.getenv("OPENAI_API_KEY")
        
        # LLM for base scenario (with BaseScenarioModel)
        base_llm = ChatOpenAI(
            model=model_name,
            temperature=0.9,
            api_key=self.api_key
        )
        self.base_llm = base_llm.with_structured_output(BaseScenarioModel)
        
        # LLM for persona generation (with PersonaModel)
        persona_llm = ChatOpenAI(
            model=model_name,
            temperature=0.8,  # Slightly lower for consistency
            api_key=self.api_key
        )
        self.persona_llm = persona_llm.with_structured_output(PersonaModel)
        
        logger.info(f"ScenarioGenerator initialized with model: {model_name} (Parallel Generation enabled)")
    
    def generate(self, user_input: str = "", difficulty: str = "mittel", max_retries: int = 1) -> dict:
        """
        Generate scenario synchronously (for CLI/testing only).
        
        NOTE: In FastAPI, use generate_async() directly to avoid event loop issues.
        """
        try:
            loop = asyncio.get_running_loop()
            # Already in async context - create task
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                return pool.submit(
                    asyncio.run,
                    self.generate_async(user_input, difficulty, max_retries)
                ).result()
        except RuntimeError:
            # No running loop - safe to use asyncio.run
            return asyncio.run(self.generate_async(user_input, difficulty, max_retries))
    
    async def generate_async(self, user_input: str = "", difficulty: str = "mittel", max_retries: int = 1) -> dict:
        """
        Generate a new murder mystery scenario using parallel persona generation.
        
        Phase 1: Generate base scenario with persona blueprints (~5-10 sec)
        Phase 2: Generate all 4 personas in parallel (~5-10 sec instead of ~20-40 sec)
        
        Total: ~10-20 sec instead of ~30-60 sec
        """
        logger.info(f"🚀 Generating scenario (Parallel Mode): difficulty={difficulty}")
        
        last_error = None
        
        for attempt in range(max_retries + 1):
            try:
                if attempt > 0:
                    logger.warning(f"Retry attempt {attempt}/{max_retries} - previous error: {last_error}")
                
                # === PHASE 1: Generate base scenario ===
                logger.info("📋 Phase 1: Generating base scenario with blueprints...")
                base_scenario = await self._generate_base_scenario(user_input, difficulty)
                logger.info(f"✅ Phase 1 complete: {base_scenario.name} with {len(base_scenario.persona_blueprints)} blueprints")
                
                # === PHASE 2: Generate all personas in parallel ===
                logger.info(f"👥 Phase 2: Generating {len(base_scenario.persona_blueprints)} personas in PARALLEL...")
                personas = await self._generate_personas_parallel(base_scenario, difficulty)
                logger.info(f"✅ Phase 2 complete: {len(personas)} personas generated")
                
                # === Assemble final scenario ===
                scenario_dict = {
                    "name": base_scenario.name,
                    "setting": base_scenario.setting,
                    "victim": base_scenario.victim.model_dump(),
                    "solution": base_scenario.solution.model_dump(),
                    "shared_knowledge": base_scenario.shared_knowledge,
                    "timeline": base_scenario.timeline,
                    "personas": [p.model_dump() for p in personas],
                    "intro_message": base_scenario.intro_message
                }
                
                # Validate
                self._validate_scenario(scenario_dict)
                
                logger.info(f"✅ Scenario generated and validated: {scenario_dict['name']}")
                return scenario_dict
                
            except Exception as e:
                last_error = str(e)
                logger.warning(f"Attempt {attempt + 1} failed: {last_error}")
                
                if attempt >= max_retries:
                    logger.error(f"All {max_retries + 1} attempts failed")
                    raise ValueError(f"Scenario generation failed: {last_error}")
        
        raise ValueError(f"Scenario generation failed: {last_error}")
    
    async def _generate_base_scenario(self, user_input: str, difficulty: str) -> BaseScenarioModel:
        """Phase 1: Generate base scenario with persona blueprints."""
        
        if user_input.strip():
            user_prompt = f"""Erstelle ein Murder Mystery Szenario basierend auf:

{user_input}

Schwierigkeit: {difficulty.upper()}
Sprache: Deutsch"""
        else:
            user_prompt = f"""Erstelle ein zufälliges, kreatives Murder Mystery Szenario.

Schwierigkeit: {difficulty.upper()}
Sprache: Deutsch

Überrasche mich mit einem ungewöhnlichen Setting!"""
        
        messages = [
            SystemMessage(content=BASE_SCENARIO_PROMPT),
            HumanMessage(content=user_prompt)
        ]
        
        # Use ainvoke for async
        return await self.base_llm.ainvoke(messages)
    
    async def _generate_personas_parallel(self, base_scenario: BaseScenarioModel, difficulty: str) -> list[PersonaModel]:
        """Phase 2: Generate all personas in parallel."""
        
        # Build context for persona generation
        scenario_context = f"""Fall: {base_scenario.name}
Setting: {base_scenario.setting}
Opfer: {base_scenario.victim.name} ({base_scenario.victim.role})
Timeline: {base_scenario.timeline}
Tatwaffe: {base_scenario.solution.weapon}
Motiv des Mörders: {base_scenario.solution.motive}"""
        
        # List of other personas for cross-references
        other_personas_list = "\n".join([
            f"- {bp.name} ({bp.role}): {bp.public_description}"
            for bp in base_scenario.persona_blueprints
        ])
        
        # Create tasks for parallel generation
        tasks = []
        for blueprint in base_scenario.persona_blueprints:
            task = self._generate_single_persona(
                blueprint=blueprint,
                scenario_context=scenario_context,
                other_personas=other_personas_list,
                difficulty=difficulty
            )
            tasks.append(task)
        
        # Run all persona generations in parallel!
        personas = await asyncio.gather(*tasks)
        
        return list(personas)
    
    async def _generate_single_persona(
        self,
        blueprint: PersonaBlueprintModel,
        scenario_context: str,
        other_personas: str,
        difficulty: str
    ) -> PersonaModel:
        """Generate a single persona based on blueprint."""
        
        logger.info(f"  👤 Generating persona: {blueprint.name}{'  🔪 (MURDERER)' if blueprint.is_murderer else ''}")
        
        # Choose instructions based on murderer status
        if blueprint.is_murderer:
            instructions = MURDERER_INSTRUCTIONS.format(difficulty=difficulty.upper())
        else:
            instructions = INNOCENT_INSTRUCTIONS
        
        prompt = PERSONA_PROMPT.format(
            scenario_context=scenario_context,
            other_personas=other_personas,
            persona_name=blueprint.name,
            persona_role=blueprint.role,
            is_murderer="JA - DU BIST DER MÖRDER!" if blueprint.is_murderer else "Nein",
            secret_summary=blueprint.secret_summary,
            murderer_instructions=instructions
        )
        
        messages = [
            SystemMessage(content="Du erstellst detaillierte Charakterprofile für Murder Mystery Spiele auf Deutsch."),
            HumanMessage(content=prompt)
        ]
        
        persona = await self.persona_llm.ainvoke(messages)
        
        # Override slug/name/role from blueprint to ensure consistency
        persona.slug = blueprint.slug
        persona.name = blueprint.name
        persona.role = blueprint.role
        persona.public_description = blueprint.public_description
        
        logger.info(f"  ✅ Persona complete: {blueprint.name}")
        return persona
    
    def _validate_scenario(self, scenario: dict) -> None:
        """
        Validate business rules that Pydantic can't enforce.
        
        Pydantic already validates:
        - All required fields exist
        - Correct types
        - At least 4 personas (min_length=4)
        - At least 3 critical clues (min_length=3)
        
        We validate:
        - Murderer slug exists in personas
        - Slugs are unique
        """
        logger.info("Validating business rules...")
        
        # Collect persona slugs
        persona_slugs = set()
        for persona in scenario["personas"]:
            slug = persona["slug"]
            if slug in persona_slugs:
                raise ValueError(f"Duplicate persona slug: {slug}")
            persona_slugs.add(slug)
        
        # Validate murderer exists in personas
        murderer_slug = scenario["solution"]["murderer"]
        if murderer_slug not in persona_slugs:
            raise ValueError(f"Murderer '{murderer_slug}' not found in personas: {persona_slugs}")
        
        logger.info(f"✅ Scenario valid: {len(scenario['personas'])} personas, murderer={murderer_slug}")
