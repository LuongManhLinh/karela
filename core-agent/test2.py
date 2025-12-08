from app.analysis.agents.story.all.graph import stream_analysis
import json

for x in stream_analysis(user_stories=[], context_input=None, existing_defects=[]):
    print("Streamed output:")
    # print(json.dumps(x, indent=2))
    print(x)
    print("-----")
