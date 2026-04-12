from app.xgraphrag.increment.lancedb_processor import LanceDBProcessor
from app.xgraphrag.defines import text_embedder
from app.xgraphrag.increment.schemas import Increment

lancedb_sync = LanceDBProcessor(
    uri=".workspace/root/EX/lancedb", embedding_model=text_embedder
)

# lancedb_sync.push_increment(
#     Increment(
#         title="Test Record 1",
#         doc_text="This is a test record for LanceDB synchronization.",
#         action="add",
#     )
# )

# lancedb_sync.push_increment(
#     Increment(
#         title="Test Record 2",
#         doc_text="This is another test record for LanceDB synchronization.",
#         action="add",
#     )
# )

# lancedb_sync.push_increment(
#     Increment(
#         action="update",
#         title="Test Record 3",
#         doc_text="This is an updated test record for LanceDB synchronization.",
#         doc_id="id-of-existing-record",
#     )
# )

increments = [
    Increment(
        title="Test Record 1",
        doc_text="This is a test record for LanceDB synchronization.",
        action="add",
    ),
    Increment(
        title="Test Record 2",
        doc_text="This is another test record for LanceDB synchronization.",
        action="add",
    ),
    Increment(
        action="update",
        title="Test Record 3",
        doc_text="This is an updated test record for LanceDB synchronization.",
        doc_id="id-of-existing-record",
    ),
]

lancedb_sync.push_increments(increments)
increments = lancedb_sync.pop_all_increments()
print(f"Popped {len(increments)} increments:")
for inc in increments:
    print(inc)
