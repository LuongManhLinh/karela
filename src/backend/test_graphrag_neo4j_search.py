from app.xgraphrag.db.importer import import_from_graphrag_output
from app.xgraphrag.search.search import search

import_from_graphrag_output(
    input_dir=".workspace/root/EX/output",
    bucket_name="root_EX",
)
