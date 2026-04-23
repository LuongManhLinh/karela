def story_to_doc(story):
    return {
        "key": story.key,
        "full_content": story_to_full_content(story),
    }


def story_to_full_content(story):
    return f"""# KEY: {story.key}
---
# SUMMARY:
{story.summary}
---
# DESCRIPTION:
{story.description}
"""
