# Parking Finder – Lite MVP (San José)

City‑wide baseline (garages/meters) + detailed street rules for focus zones (SJSU & Downtown).

## Quick Start

### 1) Copy `.env.example` -> `.env` and fill keys
- `VITE_MAP_STYLE`: e.g. MapTiler style URL with your key
- Optional `VITE_MAPBOX_GEOCODING_TOKEN` if you wire geocoding later
- `DATABASE_URL` if you run backend without Docker

### 2) Run with Docker (recommended)
```bash
docker compose up --build
# backend -> http://localhost:8000
```

Frontend (run in another terminal):
```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

Import sample data (another terminal):
```bash
docker exec -it parking_api bash -lc "python -m scripts.etl_import_geojson /data/garages.sample.geojson garage"
docker exec -it parking_api bash -lc "python -m scripts.etl_import_geojson /data/meters.sample.geojson meter"
docker exec -it parking_api bash -lc "python -m scripts.etl_import_geojson /data/segments.sample.geojson segments"
```

### 3) Run locally without Docker (optional)
Backend:
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
# ensure Postgres + PostGIS is running locally and DATABASE_URL in .env points to it
uvicorn backend.main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Notes
- This is a minimal scaffold for a class project. Do not commit real API keys.
- Always show “Unknown” when rules are missing; never guess.
