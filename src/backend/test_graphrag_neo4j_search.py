from app.xgraphrag.db.importer import import_from_graphrag_output
from app.xgraphrag.search.search import search
import asyncio

resp = asyncio.run(
    search(
        connection_id="515b536d-ab6f-4c9c-9e8e-caf2147d0aed",
        project_key="VBS",
        query="Tell me about the core functions of this system",
        method="global",
    )
)

print(resp.response)
