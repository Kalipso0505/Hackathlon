# Murder Mystery AI Service

Python/FastAPI Service für das Murder Mystery Spiel mit LangGraph Multi-Agent-System.

## Setup

### 1. Environment-Variablen

Erstelle eine `.env` Datei im `ai-service/` Ordner:

```bash
cp .env.example .env
```

Dann füge deine API Keys ein:

```env
OPENAI_API_KEY=sk-dein-api-key-hier
OPENAI_MODEL=gpt-4o-mini

# Optional: Für Crime Scene Bildgenerierung
GOOGLE_GEMINI_API_KEY=dein-gemini-api-key-hier
```

> **Hinweis:** Der `GOOGLE_GEMINI_API_KEY` ist optional. Ohne ihn werden keine Crime Scene Fotos generiert, das Spiel funktioniert aber trotzdem.

### 2. Docker starten

Vom Projekt-Root aus:

```bash
docker compose up -d
```

Der AI Service läuft dann auf `http://localhost:8001`.

### 3. Health Check

```bash
curl http://localhost:8001/health
```

Sollte zurückgeben:
```json
{"status": "healthy", "service": "murder-mystery-ai"}
```

## API Endpoints

### `POST /game/start`
Startet ein neues Spiel.

### `POST /chat`
Sendet eine Nachricht an eine Persona.

### `GET /personas`
Listet alle verfügbaren Personas.

## Architektur

```
ai-service/
├── main.py              # FastAPI App
├── agents/
│   ├── gamemaster_agent.py  # LangGraph Orchestrator
│   ├── persona_agent.py     # Persona AI Agents
│   └── graph.py             # LangGraph Definition
├── services/
│   ├── scenario_generator.py # AI Szenario-Generierung
│   ├── image_generator.py    # Gemini Crime Scene Fotos
│   └── voice_service.py      # ElevenLabs TTS
├── scenarios/
│   └── office_murder.py # Mordfall-Definition
├── Dockerfile
└── requirements.txt
```
