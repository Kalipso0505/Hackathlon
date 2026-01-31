# Murder Mystery AI Service

Python/FastAPI Service für das Murder Mystery Spiel mit LangGraph Multi-Agent-System.

## Setup

### 1. Environment-Variablen

Erstelle eine `.env` Datei im `ai-service/` Ordner:

```bash
cp .env.example .env
```

Dann füge deinen OpenAI API Key ein:

```env
OPENAI_API_KEY=sk-dein-api-key-hier
OPENAI_MODEL=gpt-4o-mini
```

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
│   └── game_master.py   # LangGraph Orchestrator
├── scenarios/
│   └── office_murder.py # Mordfall-Definition
├── Dockerfile
└── requirements.txt
```
