from concurrent.futures import ThreadPoolExecutor
from neo4j import Driver
from common.neo4j_app import default_driver
import json
import os

from .all_queries import ALL_SELF_QUERIES, ALL_PAIRWISE_QUERIES
from .targeted_queries import TARGETED_SELF_QUERIES, TARGETED_PAIRWISE_QUERIES
from .context_prompts import build_pairwise_defect_case, build_self_defect_case


def _run_all_scanners(
    connection_id: str,
    project_key: str,
    driver: Driver = default_driver,
) -> tuple[list[dict], list[dict]]:
    """Run all self and pairwise scanners in parallel and return their results.
    Returns:
    - self_results: List of dicts with keys: key, defect, reason
    - pairwise_results: List of dicts with keys: key1, key2, defect, reason
    """
    bucket = f"{connection_id}_{project_key}"
    with driver.session() as session:
        self_results = []
        pairwise_results = []
        with ThreadPoolExecutor(max_workers=len(ALL_SELF_QUERIES)) as executor:
            self_futures = [
                executor.submit(session.run, query, bucket=bucket)
                for query in ALL_SELF_QUERIES
            ]
            for future in self_futures:
                result = future.result()
                self_results.extend([record.data() for record in result])

        with ThreadPoolExecutor(max_workers=len(ALL_PAIRWISE_QUERIES)) as executor:
            pairwise_futures = [
                executor.submit(session.run, query, bucket=bucket)
                for query in ALL_PAIRWISE_QUERIES
            ]
            for future in pairwise_futures:
                result = future.result()
                pairwise_results.extend([record.data() for record in result])

    return self_results, pairwise_results


def _run_targeted_scanners(
    connection_id: str,
    project_key: str,
    target_titles: list[str],
    driver: Driver = default_driver,
) -> tuple[list[dict], list[dict]]:
    """Run targeted self and pairwise scanners in parallel and return their results.
    Queries are filtered to only include stories whose keys are in target_titles.
    Returns:
    - self_results: List of dicts with keys: key, defect, reason
    - pairwise_results: List of dicts with keys: key1, key2, defect, reason
    """
    bucket = f"{connection_id}_{project_key}"
    with driver.session() as session:
        self_results = []
        pairwise_results = []
        with ThreadPoolExecutor(max_workers=len(TARGETED_SELF_QUERIES)) as executor:
            self_futures = [
                executor.submit(
                    session.run, query, bucket=bucket, target_titles=target_titles
                )
                for query in TARGETED_SELF_QUERIES
            ]
            for future in self_futures:
                result = future.result()
                self_results.extend([record.data() for record in result])

        with ThreadPoolExecutor(max_workers=len(TARGETED_PAIRWISE_QUERIES)) as executor:
            pairwise_futures = [
                executor.submit(
                    session.run, query, bucket=bucket, target_titles=target_titles
                )
                for query in TARGETED_PAIRWISE_QUERIES
            ]
            for future in pairwise_futures:
                result = future.result()
                pairwise_results.extend([record.data() for record in result])

    return self_results, pairwise_results


def _build_defects_context(connection_id: str, project_key: str):
    self_results, pairwise_results = _run_all_scanners(connection_id, project_key)
    keys = set()
    for res in self_results:
        keys.add(res["key"])
    for res in pairwise_results:
        keys.add(res["key1"])
        keys.add(res["key2"])

    input_dir = f".workspace/{connection_id}/{project_key}/input"
    # Load JSON data from input_dir/{key}.json for each key
    # Then get the column "full_content" from the JSON
    # Ignore if the file does not exist or "full_content" is not in the JSON
    key_to_full_content = {}
    for key in keys:
        json_path = os.path.join(input_dir, f"{key}.json")
        if os.path.exists(json_path):
            with open(json_path, "r") as f:
                data = json.load(f)
                full_content = data.get("full_content")
                if full_content:
                    key_to_full_content[key] = full_content

    keys = list(key_to_full_content.keys())

    sd_map = {}  # key -> { full_content, defects: [ { defect, reason } ] }
    for res in self_results:
        key = res["key"]
        if key not in keys:
            continue
        defect = res["defect"]
        reason = res["reason"]

        if key not in sd_map:
            sd_map[key] = {"full_content": key_to_full_content[key], "defects": []}
        sd_map[key]["defects"].append({"defect": defect, "reason": reason})

    pd_anchor_map = {}  # key -> [ (other_key, defect, reason) ]
    for res in pairwise_results:
        key1 = res["key1"]
        key2 = res["key2"]
        if key1 not in keys or key2 not in keys:
            continue

        defect = res["defect"]
        reason = res["reason"]

        # For anchor-satellite map
        pd_anchor_map.setdefault(key1, []).append((key2, defect, reason))
        pd_anchor_map.setdefault(key2, []).append((key1, defect, reason))

    # Now we build a anchor-satellite defects such that
    # key -> { full_content, satellites:[{ other_key, defect, reason, full_content }] }
    # But no duplication, i.e. if key1 -> key2, then key2 will not have any defect pointing to key1
    # Prioritize the key with more defects as the anchor
    anchor_satellite_map = {}

    # Sort keys by number of defects in pairwise results
    key_defect_counts = {key: len(pd_anchor_map.get(key, [])) for key in keys}
    sorted_keys = sorted(keys, key=lambda k: key_defect_counts[k], reverse=True)

    for key in sorted_keys:
        full_content = key_to_full_content[key]

        satellites = []
        for other_key, defect, reason in pd_anchor_map[key]:
            other_full_content = key_to_full_content[other_key]
            satellites.append(
                {
                    "key": other_key,
                    "defect": defect,
                    "reason": reason,
                    "full_content": other_full_content,
                }
            )

            # Remove the reverse link to avoid duplication
            if other_key in pd_anchor_map:
                pd_anchor_map[other_key] = [
                    (k, d, r)
                    for k, d, r in pd_anchor_map[other_key]
                    if k != key and d != defect
                ]

        if satellites:
            anchor_satellite_map[key] = {
                "full_content": full_content,
                "satellites": satellites,
            }

    return sd_map, anchor_satellite_map


def _build_defects_context_targeted(
    connection_id: str, project_key: str, target_titles: list[str]
):
    self_results, pairwise_results = _run_targeted_scanners(
        connection_id, project_key, target_titles
    )
    keys = set()
    for res in self_results:
        keys.add(res["key"])
    for res in pairwise_results:
        keys.add(res["key1"])
        keys.add(res["key2"])

    input_dir = f".workspace/{connection_id}/{project_key}/input"
    key_to_full_content = {}
    for key in keys:
        json_path = os.path.join(input_dir, f"{key}.json")
        if os.path.exists(json_path):
            with open(json_path, "r") as f:
                data = json.load(f)
                full_content = data.get("full_content")
                if full_content:
                    key_to_full_content[key] = full_content

    keys = list(key_to_full_content.keys())

    sd_map = {}
    for res in self_results:
        key = res["key"]
        if key not in keys:
            continue
        defect = res["defect"]
        reason = res["reason"]

        if key not in sd_map:
            sd_map[key] = {"full_content": key_to_full_content[key], "defects": []}
        sd_map[key]["defects"].append({"defect": defect, "reason": reason})

    pd_anchor_map = {}
    for res in pairwise_results:
        key1 = res["key1"]
        key2 = res["key2"]
        if key1 not in keys or key2 not in keys:
            continue

        defect = res["defect"]
        reason = res["reason"]

        pd_anchor_map.setdefault(key1, []).append((key2, defect, reason))
        pd_anchor_map.setdefault(key2, []).append((key1, defect, reason))

    anchor_satellite_map = {}

    key_defect_counts = {key: len(pd_anchor_map.get(key, [])) for key in keys}
    sorted_keys = sorted(keys, key=lambda k: key_defect_counts[k], reverse=True)

    for key in sorted_keys:
        full_content = key_to_full_content[key]

        satellites = []
        for other_key, defect, reason in pd_anchor_map[key]:
            other_full_content = key_to_full_content[other_key]
            satellites.append(
                {
                    "key": other_key,
                    "defect": defect,
                    "reason": reason,
                    "full_content": other_full_content,
                }
            )

            if other_key in pd_anchor_map:
                pd_anchor_map[other_key] = [
                    (k, d, r)
                    for k, d, r in pd_anchor_map[other_key]
                    if k != key and d != defect
                ]

        if satellites:
            anchor_satellite_map[key] = {
                "full_content": full_content,
                "satellites": satellites,
            }

    return sd_map, anchor_satellite_map


def build_llm_contexts(connection_id: str, project_key: str) -> tuple[str, str]:
    sd_map, anchor_satellite_map = _build_defects_context(connection_id, project_key)

    self_defect_context = ""
    for idx, (key, data) in enumerate(sd_map.items()):
        self_defect_context += build_self_defect_case(
            case_number=idx + 1,
            story_key=key,
            story_content=data["full_content"],
            defects=data["defects"],
        )

    pairwise_defect_context = ""
    for idx, (key, data) in enumerate(anchor_satellite_map.items()):
        pairwise_defect_context += build_pairwise_defect_case(
            case_number=idx + 1,
            anchor_story_key=key,
            anchor_story_content=data["full_content"],
            satellite_comparisons=data["satellites"],
        )

    return self_defect_context, pairwise_defect_context


def build_llm_contexts_targeted(
    connection_id: str, project_key: str, target_titles: list[str]
) -> tuple[str, str]:
    sd_map, anchor_satellite_map = _build_defects_context_targeted(
        connection_id, project_key, target_titles
    )

    self_defect_context = ""
    for idx, (key, data) in enumerate(sd_map.items()):
        self_defect_context += build_self_defect_case(
            case_number=idx + 1,
            story_key=key,
            story_content=data["full_content"],
            defects=data["defects"],
        )

    pairwise_defect_context = ""
    for idx, (key, data) in enumerate(anchor_satellite_map.items()):
        pairwise_defect_context += build_pairwise_defect_case(
            case_number=idx + 1,
            anchor_story_key=key,
            anchor_story_content=data["full_content"],
            satellite_comparisons=data["satellites"],
        )

    return self_defect_context, pairwise_defect_context
