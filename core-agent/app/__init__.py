from contextlib import asynccontextmanager
from .chat.router import router as chat_router
from .analysis.router import router as analysis_router
from .proposal.router import router as proposal_router
from .user.router import router as user_router
from .settings.router import router as settings_router
from .integrations.jira.router import router as jira_router


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from common.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown code here


app = FastAPI(root_path="/api/v1", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_headers=["*"],
    allow_methods=["*"],
    allow_credentials=True,
)

app.include_router(analysis_router, prefix="/analyses")
app.include_router(jira_router, prefix="/integrations/jira")
app.include_router(chat_router, prefix="/chat")
app.include_router(proposal_router, prefix="/proposals")
app.include_router(user_router, prefix="/users")
app.include_router(settings_router, prefix="/settings")


@app.get("/health")
def health_check():
    return {"status": "healthy"}
