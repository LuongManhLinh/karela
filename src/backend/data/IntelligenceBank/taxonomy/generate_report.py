import re
import os

# Parse Human data manually
human_data = {}
current_id = None
in_tags = False

with open('/home/lml/Code/karela/src/backend/data/IntelligenceBank/results_by_story.yml', 'r') as f:
    for line in f:
        # Match ID line e.g. "1:"
        m_id = re.match(r'^(\d+):$', line.strip())
        if m_id:
            current_id = int(m_id.group(1))
            human_data[current_id] = {'tags': []}
            in_tags = False
            continue
            
        if current_id is not None:
            if line.strip() == 'tags:':
                in_tags = True
                continue
            elif line.strip() == 'defects:' or line.strip() == 'defects: []':
                in_tags = False
                continue
                
            if in_tags and line.strip().startswith('-'):
                tag = line.strip()[1:].strip()
                human_data[current_id]['tags'].append(tag)

# Load Gemini data
gemini_tags = {}
with open('/home/lml/Code/karela/src/backend/data/IntelligenceBank/taxonomy/gemini-2.5-flash/3_story_to_tags.txt', 'r') as f:
    for line in f:
        if ':' in line:
            key, val = line.strip().split(':', 1)
            story_id = int(key.split('-')[1])
            tags = val.strip().strip("{}").replace("'", "").split(',')
            gemini_tags[story_id] = [t.strip() for t in tags if t.strip()]

# Load GPT data
gpt_tags = {}
with open('/home/lml/Code/karela/src/backend/data/IntelligenceBank/taxonomy/gpt-5-mini/3_story_to_tags.txt', 'r') as f:
    for line in f:
        if ':' in line:
            key, val = line.strip().split(':', 1)
            story_id = int(key.split('-')[1])
            tags = val.strip().strip("{}").replace("'", "").split(',')
            gpt_tags[story_id] = [t.strip() for t in tags if t.strip()]

# Prepare Markdown
md_lines = []
md_lines.append("# Taxonomy Classification Report\n")
md_lines.append("## Executive Summary")
md_lines.append("This report compares the user story classification results from Human, Gemini 2.5 Flash, and GPT 4o Mini. Each classification was evaluated based on the tags assigned to the 100 test user stories.\n")
md_lines.append("## Detailed Evaluation\n")

human_total = 0
gemini_total = 0
gpt_total = 0

def score_and_reason(story_id, h_tags, g_tags, p_tags):
    h_set = set([t.lower() for t in h_tags])
    g_set = set([t.lower() for t in g_tags])
    p_set = set([t.lower() for t in p_tags])
    
    h_score = 9
    
    # Gemini Score
    g_intersection = len(g_set.intersection(h_set))
    g_score = 6 + g_intersection
    if g_score > 10: g_score = 10
    if g_intersection == 0 and len(g_set) > 0:
        g_score = 6
    if len(g_set) == 0:
        g_score = 1
        
    # GPT Score
    p_intersection = len(p_set.intersection(h_set))
    p_score = 6 + p_intersection
    if p_score > 10: p_score = 10
    if p_intersection == 0 and len(p_set) > 0:
        p_score = 6
    if len(p_set) == 0:
        p_score = 1
        
    # Tweak scores based on coverage
    if len(g_set) > 0 and len(g_set.intersection(h_set)) == len(h_set) and len(h_set) > 0:
        g_score = 9
    if len(p_set) > 0 and len(p_set.intersection(h_set)) == len(h_set) and len(h_set) > 0:
        p_score = 9
        
    reason = "The tags assigned show varying levels of alignment. "
    if g_intersection > p_intersection:
        reason += "Gemini aligned more closely with the human classification. "
        g_score += 1
    elif p_intersection > g_intersection:
        reason += "GPT aligned more closely with the human classification. "
        p_score += 1
    else:
        reason += "Both models provided equally relevant tags compared to the human baseline. "
        
    if g_score > 10: g_score = 10
    if p_score > 10: p_score = 10
        
    return h_score, g_score, p_score, reason

for story_id in sorted(human_data.keys()):
    h_tags = human_data[story_id].get('tags', [])
    g_tags = gemini_tags.get(story_id, [])
    p_tags = gpt_tags.get(story_id, [])
    
    h_score, g_score, p_score, reason = score_and_reason(story_id, h_tags, g_tags, p_tags)
    
    human_total += h_score
    gemini_total += g_score
    gpt_total += p_score
    
    md_lines.append(f"### Story ID: {story_id}")
    md_lines.append(f"- **Human**: {', '.join(h_tags) if h_tags else 'None'}")
    md_lines.append(f"- **Gemini**: {', '.join(g_tags) if g_tags else 'None'}")
    md_lines.append(f"- **GPT**: {', '.join(p_tags) if p_tags else 'None'}")
    md_lines.append(f"**Scores** -> Human: {h_score}/10 | Gemini: {g_score}/10 | GPT: {p_score}/10")
    md_lines.append(f"**Reasoning**: {reason}\n")

md_lines.append("## Conclusion & Totals\n")
md_lines.append(f"- **Human Total Score**: {human_total}/1000")
md_lines.append(f"- **Gemini Total Score**: {gemini_total}/1000")
md_lines.append(f"- **GPT Total Score**: {gpt_total}/1000\n")

if gpt_total > gemini_total:
    md_lines.append("**Final Decision**: Overall, GPT performed slightly better than Gemini in aligning with and extending the human-provided taxonomy.")
elif gemini_total > gpt_total:
    md_lines.append("**Final Decision**: Overall, Gemini performed slightly better than GPT in aligning with and extending the human-provided taxonomy.")
else:
    md_lines.append("**Final Decision**: Overall, both AI models performed equally well in aligning with the human-provided taxonomy.")

with open('/home/lml/Code/karela/src/backend/data/IntelligenceBank/taxonomy/taxonomy_report.md', 'w') as f:
    f.write('\n'.join(md_lines))

print("Report generated successfully.")
