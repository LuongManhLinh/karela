from app.xgraphrag.db.importer import import_from_graphrag_output
from app.xgraphrag.search.search import search
import asyncio

new_story = "# Summary:\nAs a rider, I want the option to cancel my ride anytime before the driver reaches me so that I can keep full flexibility.\n --- \n # DESCRIPTION:\nRiders may cancel a booking at no cost until the driver is within 100 meters of the pickup location.\nNo cancellation charge should be applied if the trip has not begun.\nThe system must instantly change the trip status to 'Cancelled' when requested."

resp = asyncio.run(
    search(
        connection_id="sudo",
        project_key="ORG51",
        query=f"This is the new story:\n{new_story}\n\nIs there any duplication or conflict between this story and the existing stories in the system? If so, please identify the conflicting stories and explain the nature of the conflict.",
        method="local",
    )
)

print(resp.response)
