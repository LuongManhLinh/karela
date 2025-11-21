from .chat.router import router as chat_router
from .defect.router import router as defect_router
from .user.router import router as user_router
from .settings.router import router as settings_router
from .integrations.jira.router import router as jira_router


from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from common.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(root_path="/api/v1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_headers=["*"],
    allow_methods=["*"],
    allow_credentials=True,
)

app.include_router(defect_router, prefix="/defects")
app.include_router(jira_router, prefix="/integrations/jira")
app.include_router(chat_router, prefix="/chat")
app.include_router(user_router, prefix="/users")
app.include_router(settings_router, prefix="/settings")


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/")
def read_root(param: str):
    return {"message": "Ratsnake Core-Agent LLM API ready with param: " + param}


@app.get("/file-test")
def file_test():
    return FileResponse(
        "/home/lml/Code/me/assets/icons/icon-256.png", media_type="image/png"
    )
