NOT_INDEPENDENT_QUERY = """
// Case 1: Direct Explicit Dependencies & Blockers
MATCH (k:Entity {type: 'KEY', bucket: $bucket})
WITH k, 
     size([(k)-[:DEPENDS_ON|REQUIRES]->(dep:Entity {type: 'KEY'}) | dep]) AS outbound_deps,
     size([(k)<-[:BLOCKS|DEPENDS_ON|REQUIRES]-(blk:Entity {type: 'KEY'}) | blk]) AS inbound_blocks
WHERE (outbound_deps + inbound_blocks) >= 3
RETURN k.title AS key, 'NOT_INDEPENDENT' AS defect, 
       'High explicit coupling: Depends on ' + toString(outbound_deps) + ' stories, blocks ' + toString(inbound_blocks) + ' stories.' AS reason

UNION ALL

// Case 2: Implicit Architectural Coupling (Shared bottlenecks)
MATCH (k:Entity {type: 'KEY', bucket: $bucket})-[:CONTAINS]-(shared:Entity)-[:CONTAINS]-(other_k:Entity {type: 'KEY'})
WHERE shared.type IN ['SYSTEM', 'COMPONENT', 'DATA'] AND k <> other_k
WITH k, count(DISTINCT other_k) AS implicit_deps
WHERE implicit_deps >= 4
RETURN k.title AS key, 'NOT_INDEPENDENT' AS defect, 
       'Architectural bottleneck: Highly coupled to ' + toString(implicit_deps) + ' other stories via shared systems/data.' AS reason

UNION ALL

// Case 3: Circular Dependency (A -> B -> A)
MATCH (k1:Entity {type: 'KEY', bucket: $bucket})-[:DEPENDS_ON|REQUIRES|BLOCKS]->(k2:Entity {type: 'KEY'})-[:DEPENDS_ON|REQUIRES|BLOCKS]->(k1)
RETURN k1.title AS key, 'NOT_INDEPENDENT' AS defect, 
       'Circular Dependency detected with ' + k2.title AS reason
"""

NOT_VALUABLE_QUERY = """
MATCH (k:Entity {type: 'KEY', bucket: $bucket})
// Gather connected Roles and Values
OPTIONAL MATCH (k)-[:CONTAINS|INITIATES*1..2]-(r:Entity {type: 'ROLE'})
OPTIONAL MATCH (k)-[:CONTAINS|ACHIEVES|RESULTS_IN*1..2]-(v:Entity {type: 'VALUE'})
WITH k, count(DISTINCT r) AS role_count, count(DISTINCT v) AS val_count

WHERE role_count = 0 OR val_count = 0
RETURN k.title AS key, 'NOT_VALUABLE' AS defect, 
       CASE 
         WHEN role_count = 0 AND val_count = 0 THEN 'Orphan Story: Missing both a target ROLE (Who) and a business VALUE (Why).'
         WHEN val_count = 0 THEN 'Missing business VALUE: The story describes actions but lacks a clear "So that..." outcome.'
         ELSE 'Missing target ROLE: The story lacks an initiator or user persona.'
       END AS reason
"""

NOT_ESTIMABLE_QUERY = """
// Case 1: Explicit assumptions or missing acceptance criteria
MATCH (k:Entity {type: 'KEY', bucket: $bucket})
OPTIONAL MATCH (k)-[:CONTAINS]-(asm:Entity {type: 'ASSUMPTION'})
OPTIONAL MATCH (k)-[:CONTAINS]-(ac:Entity {type: 'ACCEPTANCE_CRITERIA'})
WITH k, count(DISTINCT asm) AS asm_count, count(DISTINCT ac) AS ac_count
WHERE asm_count > 0 OR ac_count = 0
RETURN k.title AS key, 'NOT_ESTIMABLE' AS defect, 
       'Ambiguity Risk: Story contains ' + toString(asm_count) + ' undocumented assumptions and ' + toString(ac_count) + ' acceptance criteria.' AS reason

UNION ALL

// Case 2: Unbounded/Unvalidated Actions modifying backend resources
MATCH (k:Entity {type: 'KEY', bucket: $bucket})-[:CONTAINS]-(act:Entity {type: 'ACTION'})-[:MODIFIES|TRIGGERS]-(target:Entity)
WHERE target.type IN ['DATA', 'RESOURCE', 'SYSTEM']
  AND NOT EXISTS { MATCH (act)-[:VALIDATES|ENFORCES|RESTRICTS]-(:Entity {type: 'RULE'}) }
  AND NOT EXISTS { MATCH (act)-[:REQUIRES|RESTRICTS]-(:Entity {type: 'CONDITION'}) }
RETURN k.title AS key, 'NOT_ESTIMABLE' AS defect, 
       'Unvalidated State Change: Action [' + act.title + '] modifies [' + target.title + '] without any bounding rules or conditions.' AS reason

UNION ALL

// Case 3: Excessive Technical Breadth (Touches too many distinct systems)
MATCH (k:Entity {type: 'KEY', bucket: $bucket})-[:CONTAINS|MODIFIES|READS*1..2]-(sys:Entity)
WHERE sys.type IN ['SYSTEM', 'COMPONENT']
WITH k, count(DISTINCT sys) AS sys_count
WHERE sys_count > 4
RETURN k.title AS key, 'NOT_ESTIMABLE' AS defect, 
       'High Technical Complexity: Story spans across ' + toString(sys_count) + ' distinct systems/components, making estimation highly unreliable.' AS reason
"""

NOT_SMALL_QUERY = """
MATCH (k:Entity {type: 'KEY', bucket: $bucket})
OPTIONAL MATCH (k)-[:CONTAINS]-(act:Entity {type: 'ACTION'})
OPTIONAL MATCH (k)-[:CONTAINS|MODIFIES|READS*1..2]-(target:Entity)
WHERE target.type IN ['RESOURCE', 'DATA', 'UI_ELEMENT']

WITH k, count(DISTINCT act) AS action_count, count(DISTINCT target) AS impact_count
WHERE action_count >= 3 OR impact_count >= 5
RETURN k.title AS key, 'NOT_SMALL' AS defect, 
       'Scope too broad (Epic Disguised as Story): Implements ' + toString(action_count) + ' distinct actions impacting ' + toString(impact_count) + ' different resources/UI elements.' AS reason
"""

DUPLICATION_QUERY = """
// Case 1: Action Overlap on Exact Same Target
MATCH (k1:Entity {type: 'KEY', bucket: $bucket})-[:CONTAINS]-(act1:Entity {type: 'ACTION'})-[:MODIFIES|READS|TRIGGERS]-(target:Entity)
MATCH (k2:Entity {type: 'KEY', bucket: $bucket})-[:CONTAINS]-(act2:Entity {type: 'ACTION'})-[:MODIFIES|READS|TRIGGERS]-(target)
WHERE id(k1) < id(k2) 
  AND target.type IN ['RESOURCE', 'DATA', 'SYSTEM', 'UI_ELEMENT']
  AND act1.title = act2.title 
RETURN k1.title AS key1, k2.title AS key2, 'DUPLICATION' AS defect, 
       'Action Overlap: Both stories implement [' + act1.title + '] on target [' + target.title + '].' AS reason

UNION ALL

// Case 2: NFR/Rule Redundancy
MATCH (k1:Entity {type: 'KEY', bucket: $bucket})-[:CONTAINS|ENFORCES|VALIDATES*1..2]-(rule:Entity {type: 'RULE'})
MATCH (k2:Entity {type: 'KEY', bucket: $bucket})-[:CONTAINS|ENFORCES|VALIDATES*1..2]-(rule)
WHERE id(k1) < id(k2)
RETURN k1.title AS key1, k2.title AS key2, 'DUPLICATION' AS defect, 
       'NFR Redundancy: Both stories enforce the exact same rule [' + rule.title + '].' AS reason
"""

CONFLICT_QUERY = """
// Case 1: Direct Explicit Conflict recognized by LLM
MATCH (k1:Entity {type: 'KEY', bucket: $bucket})-[:CONTAINS]-(e1:Entity)-[:CONFLICTS_WITH]-(e2:Entity)-[:CONTAINS]-(k2:Entity {type: 'KEY', bucket: $bucket})
WHERE id(k1) < id(k2)
RETURN k1.title AS key1, k2.title AS key2, 'CONFLICT' AS defect, 
       'Explicit logic conflict detected between [' + e1.title + '] and [' + e2.title + '].' AS reason

UNION ALL

// Case 2: Policy vs. Action Bypass
MATCH (k1:Entity {type: 'KEY', bucket: $bucket})-[:CONTAINS|ENFORCES]-(rule:Entity {type: 'RULE'})-[:RESTRICTS|VALIDATES]-(target:Entity)
MATCH (k2:Entity {type: 'KEY', bucket: $bucket})-[:CONTAINS]-(act:Entity {type: 'ACTION'})-[:MODIFIES|READS]-(target)
WHERE k1 <> k2 AND target.type IN ['DATA', 'RESOURCE', 'SYSTEM']
  AND NOT EXISTS { MATCH (act)-[:VALIDATES|RESTRICTS]-(rule) }
RETURN k1.title AS key1, k2.title AS key2, 'CONFLICT' AS defect, 
       'Policy Clash: ' + k1.title + ' locks target [' + target.title + '] with rule [' + rule.title + '], but ' + k2.title + ' attempts an action [' + act.title + '] without validating it.' AS reason

UNION ALL

// Case 3: NFR Contradiction
MATCH (k1:Entity {type: 'KEY', bucket: $bucket})-[:CONTAINS|ENFORCES]-(r1:Entity {type: 'RULE'})-[:RESTRICTS|VALIDATES]-(target:Entity)
MATCH (k2:Entity {type: 'KEY', bucket: $bucket})-[:CONTAINS|ENFORCES]-(r2:Entity {type: 'RULE'})-[:RESTRICTS|VALIDATES]-(target)
WHERE id(k1) < id(k2) AND r1.title <> r2.title
RETURN k1.title AS key1, k2.title AS key2, 'CONFLICT' AS defect, 
       'NFR Contradiction: Target [' + target.title + '] is subjected to disparate rules: [' + r1.title + '] vs [' + r2.title + '].' AS reason
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
