# NEXUS — AI-Powered Digital Public Infrastructure (DPI) & Governance Platform

NEXUS is an AI-native Digital Public Infrastructure (DPI) and sovereign governance platform that ingests multimodal, multilingual citizen feedback and correlates it against spatial, demographic, and budgetary data to detect **Infrastructure Deficit Hotspots** and **Public Fund Misallocations**.

---

## 🏛️ System Architecture

```
[ Multimodal Inputs ] ---> [ Tier 1: Last-Mile Listener ]
  (Voice / Text / WhatsApp)       | (STT + NLP Structuring + DPDP Consent)
                                  v
                            [ PostgreSQL + PostGIS (Port 5432) ]
                                  |
                                  v
                            [ Tier 2: Data Fusion & Spatial Analytics ] (Port 8000)
                                  | (ST_Contains, IDS & Misalignment Index)
                                  v
 [ Tier 3: Governance Engine ] <--- [ Confidence Threshold Gate (<0.85) ]
   (Human Oversight Queue)        | (>=0.85 Approved)
                                  v
 [ Tier 4: Policymaker Action ] + [ Member 3: Geospatial Mapper Dashboard ]
   (Port 3000: Gemini XAI Briefs)   (Port 3001: Deck.gl / MapLibre Interactive Map)
```

| Tier / Module | Directory | Technology | Port | Description |
|---|---|---|---|---|
| **Database** | `app/models/` | PostgreSQL 15 + PostGIS 3.4 | `5432` | Spatial polygons, points, census & budget data |
| **Tier 1: Listener** | `last-mile-listener/` | FastAPI, Whisper/Bhashini, Spacy | `8001` | Multilingual intake, DPDP consent, STT & NLP |
| **Tier 2: Fusion** | `data-fusion-engine/` | FastAPI, SQLAlchemy 2.0 Async, GeoAlchemy2 | `8000` | IDS formula, misalignment index, GeoJSON API |
| **Tier 3: Mapper** | `mapper/` | Next.js 16, React 19, Deck.gl, MapLibre | `3001` | Geospatial cluster & heatmap visualizer |
| **Tier 4: Policy** | `policy-intelligence-platform/` | Next.js 16, React 19, Tailwind, Gemini | `3000` | Policymaker XAI decision support & brief generator |

---

## 🚀 Quick Start (Docker Compose — Recommended)

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- Git

### 2. Configure Environment
```bash
cp .env.example .env
```
*(Optional: Add your `GEMINI_API_KEY` in `.env` if you want AI-generated proposals instead of mock templates).*

### 3. Start All Services
```bash
docker-compose up --build
```

### 4. Seed the Database with Realistic Data (Optional / First Run)
In a separate terminal, populate the PostGIS database with Gauteng province benchmark data:
```bash
docker-compose --profile seed run seeder
```

### 5. Access the Platform
- **🏛️ Policy Intelligence Platform**: [http://localhost:3000](http://localhost:3000)
- **🗺️ Geospatial Mapper Dashboard**: [http://localhost:3001](http://localhost:3001)
- **⚡ Data Fusion Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **🎙️ Last-Mile Listener API & Swagger Docs**: [http://localhost:8001/docs](http://localhost:8001/docs)

---

## 💻 Local Development (Without Docker)

If you prefer to run services individually for development:

### 1. Start PostgreSQL with PostGIS
Ensure a local PostGIS instance is running on port 5432:
```bash
# Example via Docker just for the database:
docker run --name nexus_db -e POSTGRES_USER=nexus -e POSTGRES_PASSWORD=nexus -e POSTGRES_DB=nexusdb -p 5432:5432 -d postgis/postgis:15-3.4
```

### 2. Seed Mock Database Records
```bash
pip install -r requirements.txt
python seed_data.py
```

### 3. Start Data Fusion Engine (Tier 2 API)
```bash
cd data-fusion-engine
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Start Last-Mile Listener (Tier 1 Intake)
```bash
cd last-mile-listener
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### 5. Start Mapper Frontend (Tier 3)
```bash
cd mapper
npm install
npm run dev -- -p 3001
```

### 6. Start Policy Intelligence Frontend (Tier 4)
```bash
cd policy-intelligence-platform
npm install
npm run dev -- -p 3000
```

---

## 📡 Key API Endpoints Reference

### Data Fusion Engine (`http://localhost:8000`)
- `POST /api/v1/requests/ingest`: Ingests citizen feedback, calculates confidence, maps spatial polygon.
- `GET /api/v1/analytics/hotspots`: Returns RFC 7946 GeoJSON FeatureCollection of deficit hotspots.
- `GET /api/v1/analytics/misalignment`: Computes IDS & budget misalignment indices.
- `GET /api/v1/governance/oversight-queue`: Retrieves low-confidence records (<85%) for human review.
- `POST /api/v1/governance/oversight-queue/{id}/approve`: Approves/rejects quarantined records.
- `GET /api/v1/national-data/budgets`: Lists all regional budget allocations.
- `GET /api/v1/national-data/infrastructure`: Lists regional infrastructure sector scores.

### Last-Mile Listener (`http://localhost:8001`)
- `POST /consent/request`: Requests citizen consent under DPDP framework.
- `POST /consent/reply`: Records citizen consent response (YES/NO).
- `POST /intake/twilio/webhook`: Omnichannel intake for WhatsApp & SMS voice notes/texts.
- `POST /intake/ussd/webhook`: Lightweight USSD aggregator endpoint.

---

## 📐 Mathematical Formulas

### Infrastructure Deficit Score (IDS)
$$IDS = 0.3 \cdot V + 0.3 \cdot (1 - S) + 0.2 \cdot P + 0.2 \cdot (1 - I)$$
- $V$: Normalized citizen complaint volume
- $S$: Sentiment score ($0.0 = \text{Negative}, 1.0 = \text{Positive}$)
- $P$: Population density index
- $I$: Existing infrastructure rating

### Misalignment Index
$$\text{Misalignment Index} = \text{Percentile}(IDS) - \text{Percentile}(\text{Allocated Budget})$$
- **Critical Hotspot**: Index $> +0.50$ (High demand, low budget)
- **Over-Funded Zone**: Index $< -0.50$ (Low demand, high budget)

### Governance Confidence Gate
$$\text{Confidence} = 0.5 \cdot \text{nlp\_certainty} + 0.3 \cdot \text{spatial\_precision} + 0.2 \cdot \text{metadata}$$
- Records scoring $< 0.85$ are quarantined in `HumanOversightQueue`.

---

## 🚢 Production Deployment

### Containerized Cloud Deployment (AWS ECS / GCP Cloud Run / DigitalOcean / VPS)
1. Ensure `docker` and `docker-compose` are installed on your host.
2. Clone repository and run:
   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```
3. Set your custom domain reverse proxy (Nginx / Caddy) to route:
   - `https://your-domain.gov` -> `localhost:3000` (Policy Platform)
   - `https://maps.your-domain.gov` -> `localhost:3001` (Geospatial Mapper)
   - `https://api.your-domain.gov` -> `localhost:8000` (Data Fusion Engine)

### Static / Edge Hosting for Frontends (Vercel)
- The Next.js frontend applications in `/mapper` and `/policy-intelligence-platform` can be independently deployed to Vercel by setting `NEXT_PUBLIC_API_URL` to your backend URL in project environment variables.
