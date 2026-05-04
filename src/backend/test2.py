from app.taxonomy.agents.state import TaxonomyContext

# context = TaxonomyContext(
#     connection_id=connection_id,
#     project_key=project_key,
#     user_stories=user_stories,
#     project_description=project_description,
#     is_update=is_update,
#     seed_strategy=seed_strategy,
#     seed_size=seed_size,
#     extension_batch_size=extension_batch_size,
#     seed_hybrid_first_pct=seed_hybrid_first_pct,
# )

context = TaxonomyContext(
    connection_id="515b536d-ab6f-4c9c-9e8e-caf2147d0aed",
    project_key="VBS",
    user_stories=[],
    project_description="The Vehicle Booking System is designed to facilitate the booking of rides for passengers",
    is_update=False,
    seed_strategy="hybrid",
    seed_size=50,
    extension_batch_size=20,
    seed_hybrid_first_pct=0.6,
)

print(context.model_dump_json(indent=2))
