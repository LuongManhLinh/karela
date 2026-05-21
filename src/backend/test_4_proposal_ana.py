import json
from app.connection.jira.services import JiraService
from common.database import get_db, uuid_generator
from app.proposal.agents.schemas import ProposalContent
from app.connection.jira.schemas import StoryDto
from app.taxonomy.services import TaxonomyService
from app.analysis.agents.all import run_analysis
from app.analysis.agents.schemas import BucketGroup
from natsort import natsorted
import time

conn_id = "515b536d-ab6f-4c9c-9e8e-caf2147d0aed"
project_key = "IB2"

with open("data/IntelligenceBank/defect/final_defects.json", "r") as f:
    data = json.load(f)


related_stories: set[str] = set()
for idx, item in enumerate(data):
    story_keys = item["story_keys"]
    related_stories.update(story_keys)

jira_service = JiraService(db=next(get_db()))
project_desc = jira_service.get_project_description(
    connection_id=conn_id, project_key=project_key
)


stories = jira_service.fetch_stories(
    connection_id=conn_id,
    project_key=project_key,
    story_keys=list(related_stories),
)

print(f"Total stories fetched: {len(stories)}")


def apply_proposals(stories: list[StoryDto], proposals_path: str):
    with open(proposals_path, "r") as f:
        proposals_data = json.load(f)

    contents = [ProposalContent(**content) for content in proposals_data[0]["contents"]]

    key_to_orig_key = {}

    create_count = 0
    start_key = 500

    for content in contents:
        if content.type == "CREATE":
            create_count += 1
            new_key = f"IB2-{start_key + create_count}"
            stories.append(
                StoryDto(
                    key=new_key,
                    summary=content.summary,
                    description=content.description,
                    id=uuid_generator(),
                )
            )
            key_to_orig_key[new_key] = content.original_story_key
        elif content.type == "UPDATE":
            for story in stories:
                if story.key == content.story_key:
                    story.summary = content.summary
                    story.description = content.description
                    key_to_orig_key[story.key] = story.key
                    break
        else:
            # Delete
            stories = [story for story in stories if story.key != content.story_key]

    return stories, key_to_orig_key


def test_proposal_defects(model: str, result_idx: int, stories: list[StoryDto]):

    updated_stories, key_mapping = apply_proposals(
        stories,
        f"data/IntelligenceBank/proposal/{model}/{result_idx}_IB2_proposals.json",
    )

    key_to_story = {story.key: story for story in updated_stories}

    print(f"Total stories after applying proposals: {len(updated_stories)}")

    taxonomy_service = TaxonomyService(db=next(get_db()))
    story_to_tags, tag_to_stories = taxonomy_service.get_project_stories_tags(
        connection_id=conn_id,
        project_key=project_key,
    )

    bucket_groups: list[BucketGroup] = []
    checked_pairs: set[tuple[str, str]] = set()
    sorted_stories = natsorted(updated_stories, key=lambda s: s.key)
    for story in sorted_stories:
        orig_key = key_mapping.get(story.key, story.key)
        tags = story_to_tags.get(orig_key, set())
        related_keys = set()
        for tag in tags:
            related_keys.update(tag_to_stories.get(tag, set()))

        related_stories: list[StoryDto] = []
        for related_key in related_keys:
            if related_key == story.key:
                continue
            pair = tuple(sorted([story.key, related_key]))
            if pair in checked_pairs:
                continue
            checked_pairs.add(pair)

            related = key_to_story.get(related_key)
            if related:
                related_stories.append(related)

        if related_stories:
            bucket_groups.append(
                BucketGroup(
                    target_story=story,
                    related_stories=related_stories,
                )
            )

    defects = run_analysis(
        connection_id=conn_id,
        project_key=project_key,
        info_provided=True,
        all_stories=updated_stories,
        bucket_groups=bucket_groups,
        db=next(get_db()),
        project_description=project_desc,
        group_story=True,
    )

    with open(
        f"data/IntelligenceBank/proposal/{model}/{result_idx}_IB2_defects.json",
        "w",
    ) as f:
        json.dump([defect.model_dump() for defect in defects], f, indent=2)


for model in ["gpt"]:
    for result_idx in range(1, 2):
        print(f"Testing {model} result {result_idx}...")
        start_time = time.time()
        test_proposal_defects(model, result_idx, stories.copy())
        end_time = time.time()

        # Log time to a file
        with open(
            f"data/IntelligenceBank/proposal/{model}/check_defect_time.md", "a"
        ) as f:
            f.write(f"- Result {result_idx}: {end_time - start_time:.2f} seconds\n")
