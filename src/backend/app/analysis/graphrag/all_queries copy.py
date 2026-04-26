NOT_INDEPENDENT_QUERY = """
MATCH (sys:Entity {bucket: $bucket})
WHERE sys.type IN ['SYSTEM', 'COMPONENT', 'DATA']
  AND sys.text_unit_ids IS NOT NULL
WITH sys, size(sys.text_unit_ids) AS shared_count
WHERE shared_count >= 3
RETURN sys.title AS bottleneck_node, 
       'NOT_INDEPENDENT' AS defect, 
       'Architectural Bottleneck: This component is heavily coupled across ' + toString(shared_count) + ' different stories.' AS reason,
       sys.text_unit_ids AS source_units
"""

NOT_VALUABLE_QUERY = """
MATCH (act:Entity {type: 'ACTION', bucket: $bucket})
// Look for roles and values within flexible undirected hops
OPTIONAL MATCH (act)-[*1..2]-(r:Entity {type: 'ROLE'})
OPTIONAL MATCH (act)-[*1..3]-(v:Entity {type: 'VALUE'})
WITH act, count(DISTINCT r) AS role_count, count(DISTINCT v) AS val_count
WHERE role_count = 0 OR val_count = 0
RETURN act.title AS action, 
       'NOT_VALUABLE' AS defect, 
       CASE 
         WHEN role_count = 0 AND val_count = 0 THEN 'Orphan Action: Missing both an initiating ROLE and a business VALUE.'
         WHEN val_count = 0 THEN 'Missing business VALUE: Lacks a clear outcome or goal.'
         ELSE 'Missing target ROLE: Lacks an assigned user persona.'
       END AS reason,
       act.text_unit_ids AS source_units
"""

NOT_ESTIMABLE_QUERY = """
MATCH (act:Entity {type: 'ACTION', bucket: $bucket})-[*1..2]-(target:Entity)
WHERE target.type IN ['DATA', 'RESOURCE', 'SYSTEM']
// Look for any guarding rules nearby
OPTIONAL MATCH (act)-[*1..2]-(guard:Entity)
WHERE guard.type IN ['RULE', 'CONDITION', 'ACCEPTANCE_CRITERIA']
WITH act, target, count(DISTINCT guard) AS guard_count
WHERE guard_count = 0
RETURN act.title AS action, target.title AS target, 
       'NOT_ESTIMABLE' AS defect, 
       'Unvalidated State Change: Action interacts with a core resource without any bounding rules, conditions, or criteria.' AS reason,
       act.text_unit_ids AS source_units
"""

NOT_SMALL_QUERY = """
MATCH (n:Entity {bucket: $bucket})
WHERE n.type IN ['ACTION', 'RESOURCE', 'SYSTEM', 'UI_ELEMENT']
  AND n.text_unit_ids IS NOT NULL
UNWIND n.text_unit_ids AS tu_id
WITH tu_id, 
     count(DISTINCT CASE WHEN n.type = 'ACTION' THEN n.title END) AS action_count, 
     count(DISTINCT CASE WHEN n.type IN ['RESOURCE', 'SYSTEM', 'UI_ELEMENT'] THEN n.title END) AS impact_count
WHERE action_count >= 3 OR impact_count >= 5
RETURN tu_id AS source_unit, 
       'NOT_SMALL' AS defect, 
       'Scope too broad: This single story implies ' + toString(action_count) + ' distinct actions and impacts ' + toString(impact_count) + ' different resources.' AS reason
"""

DUPLICATION_QUERY = """
MATCH (act:Entity {type: 'ACTION', bucket: $bucket})-[*1..2]-(target:Entity)
WHERE target.type IN ['RESOURCE', 'DATA', 'SYSTEM']
  AND act.text_unit_ids IS NOT NULL 
  AND target.text_unit_ids IS NOT NULL
WITH act, target, 
     [x IN act.text_unit_ids WHERE x IN target.text_unit_ids] AS overlapping_units
// If the overlapping text units are > 1, multiple stories describe this exact interaction
WHERE size(overlapping_units) > 1
RETURN act.title AS action, target.title AS target, 
       'DUPLICATION' AS defect, 
       'Action Overlap: ' + toString(size(overlapping_units)) + ' distinct stories implement this exact interaction.' AS reason,
       overlapping_units AS source_units
"""

CONFLICT_QUERY = """
MATCH (rule:Entity {type: 'RULE', bucket: $bucket})-[*1..2]-(target:Entity)-[*1..2]-(act:Entity {type: 'ACTION'})
WHERE target.type IN ['DATA', 'RESOURCE', 'SYSTEM']
  AND rule.text_unit_ids IS NOT NULL 
  AND act.text_unit_ids IS NOT NULL
// Ensure there is no direct validation link between the action and the rule
  AND NOT EXISTS { MATCH (act)-[*1..2]-(rule) }
WITH rule, act, target, 
     [x IN rule.text_unit_ids WHERE x IN act.text_unit_ids] AS intersection
// They must come from completely different text units to be a cross-story conflict
WHERE size(intersection) = 0 
RETURN rule.title AS rule, act.title AS action, target.title AS target, 
       'CONFLICT' AS defect, 
       'Policy Bypass: A rule restricts the target, but a disparate action from another story modifies it without validation.' AS reason,
       rule.text_unit_ids AS rule_units, act.text_unit_ids AS act_units
"""

ALL_QUERIES = [
    NOT_INDEPENDENT_QUERY,
    NOT_VALUABLE_QUERY,
    NOT_ESTIMABLE_QUERY,
    NOT_SMALL_QUERY,
    DUPLICATION_QUERY,
    CONFLICT_QUERY,
]

ALL_SELF_QUERIES = [
    NOT_INDEPENDENT_QUERY,
    NOT_VALUABLE_QUERY,
    NOT_ESTIMABLE_QUERY,
    NOT_SMALL_QUERY,
]

ALL_PAIRWISE_QUERIES = [
    DUPLICATION_QUERY,
    CONFLICT_QUERY,
]
