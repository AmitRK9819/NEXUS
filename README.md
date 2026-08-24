# NEXUS: AI-Powered Digital Public Infrastructure (DPI) & Governance Platform

NEXUS is an AI-native Digital Public Infrastructure (DPI) and governance platform designed to bridge the gap between multimodal citizen grievance reporting and sovereign infrastructure planning.

NEXUS ingests multilingual, multimodal citizen feedback and correlates it against real-time spatial, demographic, and budgetary data using PostGIS geospatial queries, a custom dual-metric evaluation algorithm (Infrastructure Deficit Score & Misalignment Index), and automated AI governance pathways.

---

## 🏛️ System Architecture

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 CITIZEN INGESTION (TIER 1)             │
                  │   WhatsApp / SMS / USSD / Voice Notes / Web Simulator  │
                  └───────────────────────────┬────────────────────────────┘
                                              │
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │       LAST-MILE LISTENER & DPDP CONSENT ENGINE         │
                  │   • Bhashini / Whisper STT    • SpaCy / Regex Geocoding│
                  │   • VADER Sentiment Polarity  • DPDP Pseudonymous Hash │
                  └───────────────────────────┬────────────────────────────┘
                                              │
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │          DATA FUSION & ANALYTICS ENGINE (TIER 2)       │
                  │   • PostGIS ST_Contains       • IDS Calculation        │
                  │   • Geospatial Hotspots       • Misalignment Ranking   │
                  └─────────────┬───────────────────────────┬──────────────┘
                                │                           │
                 [Confidence ≥ 85%]                 [Confidence < 85%]
                                │                           │
                                ▼                           ▼
       ┌─────────────────────────────────┐   ┌────────────────────────────────┐
       │   SOVEREIGN DECISION SUPPORT    │   │  HUMAN OVERSIGHT TRIAGE QUEUE  │
       │   • Strategic Recommendations   │   │  • Quarantined Anomalies       │
       │   • Explainable Evidence (XAI)  │   │  • Manual Inspector Sign-Off   │
       │   • Gemini 2.0 Project Briefs   │   └────────────────────────────────┘
       └─────────────────────────────────┘
```

---

## 📁 Systematic Monorepo Structure

```
NEXUS/
├── backend/                              # Unified FastAPI Backend (Port 8000)
│   ├── app/
│   │   ├── api/                          # Endpoints: /analytics, /governance, /intake, /consent, /national-data
│   │   ├── core/                         # Configuration, Async & Sync PostGIS Engines
│   │   ├── models/                       # Canonical PostGIS ORM schemas
│   │   ├── schemas/                      # Pydantic data contracts
│   │   ├── services/                     # IDS & Misalignment math, NLP pipeline, STT, Consent
│   │   └── main.py                       # Single FastAPI entrypoint
│   ├── seed/
│   │   └── seed_data.py                  # Live database seeder (Gauteng Province benchmark)
│   ├── tests/                            # Pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                             # Unified Next.js Platform (Port 3000)
│   ├── app/
│   │   ├── dashboard/                    # Policy Intelligence & Recommendation Feed
│   │   ├── map/                          # Deck.gl & MapLibre Geospatial Hotspots & Budget Overlays
│   │   ├── triage/                       # Human Oversight & Governance Queue
│   │   ├── intake/                       # Multimodal Citizen Grievance Intake Simulator
│   │   ├── history/                      # Decision Audit Trail & Inspection Logs
│   │   ├── proposals/[id]/               # AI Project Proposal Brief Generator (Gemini 2.0)
│   │   └── recommendations/[id]/         # XAI Evidence & 6-Month Trend Breakdown
│   ├── components/                       # Map layers, Filter controls, KPI cards, Modals
│   ├── lib/                              # API client, store, mock data fallback
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml                    # Unified 3-container orchestration (db, backend, frontend)
├── .env.example & .env
└── README.md
```

---

## 🚀 Step-by-Step Quick Start (Docker)

### 1. Start the Platform
```bash
docker compose up --build -d
```

### 2. Seed the Database with Realistic Benchmark Data
```bash
docker compose --profile seed run seeder
```

### 3. Open the Unified Interfaces
- **Unified Web Platform**: [`http://localhost:3000`](http://localhost:3000)
  - 🏛️ **Policy Dashboard**: [`http://localhost:3000/dashboard`](http://localhost:3000/dashboard)
  - 🗺️ **Spatial Hotspot Map**: [`http://localhost:3000/map`](http://localhost:3000/map)
  - ⚖️ **Governance Triage**: [`http://localhost:3000/triage`](http://localhost:3000/triage)
  - 🎙️ **Citizen Intake**: [`http://localhost:3000/intake`](http://localhost:3000/intake)
  - 📜 **Decision History**: [`http://localhost:3000/history`](http://localhost:3000/history)
- **Unified Backend Swagger Docs**: [`http://localhost:8000/docs`](http://localhost:8000/docs)

---

## 💻 Local Development (Without Docker)

### Backend Setup
```bash
# 1. Activate virtual environment
python -m venv .venv
.venv\Scripts\activate  # On Windows

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Start Backend Server
uvicorn backend.app.main:app --reload --port 8000
```

### Frontend Setup
```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start Frontend Server
npm run dev
```

---

## 🧪 Running Tests

### Backend Unit Tests
```bash
pytest backend/tests
```

### Database Seeder Dry-Run
```bash
python backend/seed/seed_data.py --dry-run
```
