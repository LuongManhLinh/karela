NOT_INDEPENDENT_QUERY = """
// 1. Detect Circular Dependency (Story A -> Story B -> Story A)
MATCH (s1:Entity {type: 'KEY', bucket: $bucket})-[:RELATED {type: 'DEPENDS_ON'}|:RELATED {type: 'BLOCKS'}]->(s2:Entity {type: 'KEY'})-[:RELATED {type: 'DEPENDS_ON'}|:RELATED {type: 'BLOCKS'}]->(s1)
WHERE s1.title IN $target_titles
RETURN s1.title AS key, 
       'NOT_INDEPENDENT' AS defect, 
       'Circular Dependency with ' + s2.title AS reason

UNION ALL

// 2. Detect Bottleneck: Depends on or blocked by too many stories (>= 3)
MATCH (s:Entity {type: 'KEY', bucket: $bucket})
WHERE s.title IN $target_titles
OPTIONAL MATCH (s)-[:RELATED {type: 'DEPENDS_ON'}]->(s_dep:Entity {type: 'KEY'})
OPTIONAL MATCH (s)<-[:RELATED {type: 'BLOCKS'}]-(s_blk:Entity {type: 'KEY'})
WITH s, count(DISTINCT s_dep) + count(DISTINCT s_blk) AS total_deps
WHERE total_deps >= 3
RETURN s.title AS key, 
       'NOT_INDEPENDENT' AS defect, 
       'Depends on or blocked by ' + toString(total_deps) + ' other stories' AS reason
"""

NOT_VALUABLE_QUERY = """
MATCH (s:Entity {type: 'KEY', bucket: $bucket})
WHERE s.title IN $target_titles
// Search within 2 hops to ensure it connects to business context, not just technical implementation
  AND NOT exists((s)-[:RELATED*1..2]-(:Entity {type: 'ROLE', bucket: $bucket}))
  AND NOT exists((s)-[:RELATED*1..2]-(:Entity {type: 'VALUE', bucket: $bucket}))
RETURN s.title AS key, 
       'NOT_VALUABLE' AS defect, 
       'Orphan story: No Role or Value attached in the graph' AS reason
"""

NOT_ESTIMABLE_QUERY = """
MATCH (s:Entity {type: 'KEY', bucket: $bucket})-[:RELATED*1..2]-(complexity_node:Entity {bucket: $bucket})
WHERE s.title IN $target_titles
  AND complexity_node.type IN ['SYSTEM', 'COMPONENT', 'DATA', 'RULE']
WITH s, count(DISTINCT complexity_node) AS complexity_score
WHERE complexity_score > 5 // Threshold for technical and constraint complexity
RETURN s.title AS key, 
       'NOT_ESTIMABLE' AS defect, 
       'High technical risk: Bound by ' + toString(complexity_score) + ' complex nodes (Systems/Rules/Data)' AS reason
"""

NOT_SMALL_QUERY = """
MATCH (s:Entity {type: 'KEY', bucket: $bucket})
WHERE s.title IN $target_titles
OPTIONAL MATCH (s)-[:RELATED {type: 'IMPLEMENTS'}]->(a:Entity {type: 'ACTION'})
OPTIONAL MATCH (s)-[:RELATED {type: 'MODIFIES'}]->(res:Entity) WHERE res.type IN ['RESOURCE', 'DATA']
WITH s, count(DISTINCT a) AS action_count, count(DISTINCT res) AS modify_count, collect(DISTINCT a.title) AS actions
WHERE action_count >= 3 OR modify_count >= 3
RETURN s.title AS key, 
       'NOT_SMALL' AS defect, 
       'Story scope too broad. Actions: ' + toString(action_count) + ', Modifies: ' + toString(modify_count) + ' resources.' AS reason
"""

DUPLICATION_QUERY = """
// 1. Action Overlap on same target
MATCH (s1:Entity {type: 'KEY', bucket: $bucket})-[:RELATED {type: 'IMPLEMENTS'}]->(a:Entity {type: 'ACTION'})<-[:RELATED {type: 'IMPLEMENTS'}]-(s2:Entity {type: 'KEY'})
MATCH (s1)-[:RELATED]->(target:Entity)<-[:RELATED]-(s2)
WHERE target.type IN ['RESOURCE', 'DATA', 'SYSTEM', 'COMPONENT'] AND s1.title < s2.title
  AND (s1.title IN $target_titles OR s2.title IN $target_titles)
RETURN s1.title AS key1, s2.title AS key2, 'DUPLICATION' AS defect, 
       'Both implement [' + a.title + '] on target [' + target.title + ']' AS reason

UNION ALL

// 2. Rule Overlap: Redundant NFR definition
MATCH (s1:Entity {type: 'KEY', bucket: $bucket})-[:RELATED*1..2]-(r:Entity {type: 'RULE'})-[:RELATED*1..2]-(s2:Entity {type: 'KEY'})
MATCH (s1)-[:RELATED]->(target:Entity)<-[:RELATED]-(s2)
WHERE target.type IN ['SYSTEM', 'RESOURCE'] AND s1.title < s2.title
  AND (s1.title IN $target_titles OR s2.title IN $target_titles)
RETURN s1.title AS key1, s2.title AS key2, 'DUPLICATION' AS defect, 
       'Redundant NFR: Both stories enforce rule [' + r.title + '] on [' + target.title + ']' AS reason
"""

CONFLICT_QUERY = """
// 1. Direct LLM-flagged Conflict
MATCH (s1:Entity {type: 'KEY', bucket: $bucket})-[:RELATED*1..2]-(e1:Entity)-[r:RELATED {type: 'CONFLICTS_WITH'}]-(e2:Entity)-[:RELATED*1..2]-(s2:Entity {type: 'KEY'})
WHERE s1.title < s2.title
  AND (s1.title IN $target_titles OR s2.title IN $target_titles)
RETURN s1.title AS key1, s2.title AS key2, 'CONFLICT' AS defect, 
       'Direct explicit conflict: [' + e1.title + '] vs [' + e2.title + ']' AS reason

UNION ALL

// 2. NFR vs NFR (UX/UI Clash - e.g., Skeleton vs Circular Progress)
MATCH (s1:Entity {type: 'KEY', bucket: $bucket})-[:RELATED*1..2]-(rule1:Entity {type: 'RULE'})-[r1:RELATED]-(target:Entity)
MATCH (s2:Entity {type: 'KEY', bucket: $bucket})-[:RELATED*1..2]-(rule2:Entity {type: 'RULE'})-[r2:RELATED]-(target:Entity)
WHERE target.type IN ['SYSTEM', 'RESOURCE', 'COMPONENT', 'DATA'] 
  AND s1.title < s2.title AND rule1.title <> rule2.title
  AND (s1.title IN $target_titles OR s2.title IN $target_titles)
RETURN s1.title AS key1, s2.title AS key2, 'POTENTIAL_CONFLICT' AS defect, 
       'NFR Clash on target [' + target.title + ']: (' + rule1.title + ' vs ' + rule2.title + ')' AS reason

UNION ALL

// 3. Rule vs Action (Security vs Access - e.g., Encryption vs Admin Read)
MATCH (s1:Entity {type: 'KEY', bucket: $bucket})-[:RELATED*1..2]-(rule:Entity {type: 'RULE'})-[r1:RELATED]-(target:Entity)
MATCH (s2:Entity {type: 'KEY', bucket: $bucket})-[:RELATED*1..2]-(act:Entity {type: 'ACTION'})-[r2:RELATED]-(target:Entity)
WHERE target.type IN ['SYSTEM', 'DATA'] AND s1.title <> s2.title
  AND (s1.title IN $target_titles OR s2.title IN $target_titles)
RETURN s1.title AS key1, s2.title AS key2, 'POTENTIAL_CONFLICT' AS defect, 
       'Policy vs Action Clash: Target [' + target.title + '] is restricted by rule [' + rule.title + '] from ' + s1.title + ', but ' + s2.title + ' attempts action [' + act.title + '] on it.' AS reason
"""

TARGETED_QUERIES = [
    NOT_INDEPENDENT_QUERY,
    NOT_VALUABLE_QUERY,
    NOT_ESTIMABLE_QUERY,
    NOT_SMALL_QUERY,
    DUPLICATION_QUERY,
    CONFLICT_QUERY,
]

TARGETED_SELF_QUERIES = [
    NOT_INDEPENDENT_QUERY,
    NOT_VALUABLE_QUERY,
    NOT_ESTIMABLE_QUERY,
    NOT_SMALL_QUERY,
]

TARGETED_PAIRWISE_QUERIES = [
    DUPLICATION_QUERY,
    CONFLICT_QUERY,
]
