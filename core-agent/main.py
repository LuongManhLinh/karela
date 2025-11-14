from fastapi import FastAPI
import defect.router
import integrations.jira.router
from database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(root_path="/api/v1")
app.include_router(defect.router.router, prefix="/defects")
app.include_router(integrations.jira.router.router, prefix="/integrations/jira")


@app.get("/")
def read_root():
    return {"msg": "Ratsnake Core-Agent LLM API ready"}
