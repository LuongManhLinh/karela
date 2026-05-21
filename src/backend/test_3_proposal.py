import json
from app.connection.jira.services import JiraService
from common.database import get_db
from app.proposal.agents.graph import run_proposal_generation, DefectForProposal
import time

conn_id = "515b536d-ab6f-4c9c-9e8e-caf2147d0aed"
project_key = "IB2"

with open("data/IntelligenceBank/defect/final_defects.json", "r") as f:
    data = json.load(f)


defects: list[DefectForProposal] = []
related_stories: set[str] = set()
for idx, item in enumerate(data):
    story_keys = item["story_keys"]
    related_stories.update(story_keys)
    defect = DefectForProposal(
        id=f"{project_key}_DEF_{idx}",
        type=item["type"],
        story_keys=story_keys,
        severity=item["severity"],
        explanation=item["explanation"],
        confidence=item["confidence"],
        suggested_fix=item["suggested_fix"],
    )
    defects.append(defect)

print(f"Loaded {len(defects)} defects for proposal generation.")

jira_service = JiraService(db=next(get_db()))
project_desc = jira_service.get_project_description(
    connection_id=conn_id, project_key=project_key
)


stories = jira_service.fetch_stories(
    connection_id=conn_id,
    project_key=project_key,
    story_keys=list(related_stories),
)
print(f"Fetched {len(stories)} related stories")

for i in range(1, 4):
    print(f"Starting test {i}")
    start_time = time.time()
    mode = "SIMPLE"

    proposals = run_proposal_generation(
        mode=mode,
        user_stories=stories,
        defects=defects,
        db=next(get_db()),
        connection_id=conn_id,
        project_key=project_key,
        project_description=project_desc,
    )

    end_time = time.time()
    print(
        f"Generated {len(proposals)} proposals in {end_time - start_time:.2f} seconds"
    )
    with open(
        f"data/IntelligenceBank/proposal/gpt/{i}_{project_key}_proposals.json",
        "w",
    ) as f:
        json.dump([p.model_dump() for p in proposals], f, indent=2)
