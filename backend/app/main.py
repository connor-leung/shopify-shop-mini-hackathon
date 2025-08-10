from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .controllers.progress_controller import router as progress_router
from .database import engine, Base
from .models import user_progress

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Shop Mini Games API",
    description="API for tracking user progress and completion times in shop mini games",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(progress_router)

@app.get("/")
async def root():
    return {"message": "Shop Mini Games API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2025-01-08T00:00:00Z"}