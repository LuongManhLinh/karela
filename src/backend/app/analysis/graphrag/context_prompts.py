DEFECT_TEMPLATE = """<DEFECT>
    <TYPE>{defect}</TYPE>
    <REASON>{reason}</REASON>
</DEFECT>
"""


SELF_DEFECT_CASE_TEMPLATE = """<CASE id={case_id}>
<STORY>
<ID>{story_key}</ID>
<CONTENT>{story_content}</CONTENT>
</STORY>

<FLAGGED_DEFECTS>
{defects}
</FLAGGED_DEFECTS>
</CASE>
"""

PAIRWISE_SATELLITE_CASE_TEMPLATE = """<STATELLITE_CASE id={satellite_case_id}>
<TARGET_STORY>
<ID>{target_story_key}</ID>
<CONTENT>{target_story_content}</CONTENT>
</TARGET_STORY>

{defect}
</STATELLITE_CASE>
"""

PAIRWISE_DEFECT_CASE_TEMPLATE = """<CASE id={case_id}>
<ANCHOR_STORY>
<ID>{anchor_story_key}</ID>
<CONTENT>{anchor_story_content}</CONTENT>
</ANCHOR_STORY>

<SATELLITE_COMPARISONS>
{satellite_comparisons}
</SATELLITE_COMPARISONS>
</CASE>
"""

# Format the XML
import xml.dom.minidom as xml


def format_xml(xml_string: str) -> str:
    dom = xml.parseString(xml_string)
    return dom.toprettyxml(indent="  ")


def build_self_defect_case(
    case_id: int, story_key: str, story_content: str, defects: list[dict]
) -> str:
    defect_str = ""
    for defect in defects:
        defect_str += DEFECT_TEMPLATE.format(
            defect=defect["defect"], reason=defect["reason"]
        )
    return SELF_DEFECT_CASE_TEMPLATE.format(
        case_id=case_id,
        story_key=story_key,
        story_content=story_content,
        defects=defect_str,
    )


def _build_pairwise_satellite_case(
    satellite_case_id: int,
    target_story_key: str,
    target_story_content: str,
    defect: dict,
) -> str:
    case = PAIRWISE_SATELLITE_CASE_TEMPLATE.format(
        satellite_case_id=satellite_case_id,
        target_story_key=target_story_key,
        target_story_content=target_story_content,
        defect=DEFECT_TEMPLATE.format(defect=defect["defect"], reason=defect["reason"]),
    )
    return format_xml(case)


def build_pairwise_defect_case(
    case_id: int,
    anchor_story_key: str,
    anchor_story_content: str,
    satellite_comparisons: list[dict],
) -> str:
    satellite_comparisons_str = ""
    for idx, comparison in enumerate(satellite_comparisons):
        satellite_comparisons_str += _build_pairwise_satellite_case(
            satellite_case_id=idx + 1,
            target_story_key=comparison["key"],
            target_story_content=comparison["full_content"],
            defect={"defect": comparison["defect"], "reason": comparison["reason"]},
        )
    case = PAIRWISE_DEFECT_CASE_TEMPLATE.format(
        case_id=case_id,
        anchor_story_key=anchor_story_key,
        anchor_story_content=anchor_story_content,
        satellite_comparisons=satellite_comparisons_str,
    )
    return format_xml(case)
