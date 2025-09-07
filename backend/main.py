from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import parking, health

app = FastAPI(title="Parking Finder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(parking.router)
