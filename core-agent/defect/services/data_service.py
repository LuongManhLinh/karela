from defect.models import (
    Analysis,
    AnalysisStatus,
    AnalysisType,
    ChatSession,
    Message,
    Defect,
    DefectWorkItemId,
    SenderRole,
    WorkItemVersion,
    StoryChangeProposal,
    StoryChangeContent,
    ProposalType,
)
from defect.schemas import (
    AnalysisDetailDto,
    AnalysisSummary,
    ChatProposalContentDto,
    ChatProposalDto,
    DefectDto,
    AnalysisDto,
    ChatMessageDto,
    ChatSessionDto,
)
from integrations.jira.client import default_client as jira_client
from integrations.jira.schemas import IssuesCreateRequest
from utils.markdown_adf_bridge import adf_to_md, md_to_adf


from sqlalchemy import func
from sqlalchemy.orm import Session


from typing import List, Optional


class DefectDataService:
    @staticmethod
    def init_analysis(db: Session, project_key: str, analysis_type: str) -> str:
        analysis = Analysis(
            project_key=project_key,
            type=AnalysisType(analysis_type.capitalize()),
            status=AnalysisStatus.PENDING,
            title="Pending...",
        )

        db.add(analysis)
        db.commit()

        return analysis.id

    @staticmethod
    def get_analysis_status(db: Session, analysis_id: str) -> Optional[str]:
        status = db.query(Analysis.status).filter(Analysis.id == analysis_id).first()
        if status:
            return status[0].value
        return None

    @staticmethod
    def get_analysis_summaries(db: Session, project_key: str) -> List[AnalysisSummary]:
        analyses = (
            db.query(Analysis)
            .filter(Analysis.project_key == project_key)
            .order_by(Analysis.started_at.desc())
            .all()
        )

        return [
            AnalysisSummary(
                id=analysis.id,
                status=analysis.status.value,
                type=analysis.type.value,
                started_at=analysis.started_at.isoformat(),
                ended_at=(analysis.ended_at.isoformat() if analysis.ended_at else None),
            )
            for analysis in analyses
        ]

    @staticmethod
    def get_analysis_detail(
        db: Session, analysis_id: str
    ) -> Optional[AnalysisDetailDto]:
        analysis_detail = db.query(Analysis).filter(Analysis.id == analysis_id).first()

        print("Fetched analysis detail:", analysis_detail)

        if not analysis_detail:
            return None

        # Query order by solved, type asc, severity desc
        defects = (
            db.query(Defect)
            .filter(Defect.analysis_detail_id == analysis_detail.id)
            .order_by(Defect.solved.asc(), Defect.type.asc(), Defect.severity.desc())
            .all()
        )

        defects_dto = [
            DefectDto(
                id=defect.id,
                type=defect.type.value,
                severity=defect.severity.value,
                explanation=defect.explanation,
                confidence=defect.confidence,
                suggested_fix=defect.suggested_fix,
                solved=defect.solved,
                work_item_keys=[
                    work_item.work_item_id for work_item in defect.work_item_ids
                ],
            )
            for defect in defects
        ]

        return AnalysisDetailDto(
            id=analysis_detail.id,
            defects=defects_dto,
        )

    @staticmethod
    def init_analysis(db: Session, project_key: str, analysis_type: str) -> str:
        print("Initializing analysis for project:", project_key, "type:", analysis_type)
        analysis = Analysis(
            project_key=project_key,
            type=AnalysisType(analysis_type.upper()),
            status=AnalysisStatus.PENDING,
            title="Pending...",
        )

        db.add(analysis)
        db.commit()

        return analysis.id

    @staticmethod
    def change_defect_solved(db: Session, defect_id: str, solved: bool):
        defect = db.query(Defect).filter(Defect.id == defect_id).first()
        if not defect:
            raise ValueError(f"Defect with id {defect_id} not found")

        defect.solved = solved
        db.add(defect)
        db.commit()

    @staticmethod
    def get_defects_by_work_item_key(db: Session, key: str) -> List[DefectDto]:
        defects = (
            db.query(Defect)
            .join(DefectWorkItemId)
            .filter(DefectWorkItemId.work_item_id == key)
            .all()
        )

        return [
            DefectDto(
                id=defect.id,
                type=defect.type.value,
                severity=defect.severity.value,
                explanation=defect.explanation,
                confidence=defect.confidence,
                suggested_fix=defect.suggested_fix,
                solved=defect.solved,
                work_item_keys=[
                    work_item.work_item_id for work_item in defect.work_item_ids
                ],
            )
            for defect in defects
        ]

    @staticmethod
    def create_chat_session(
        db: Session,
        inital_message: str,
        role: str,
        project_key: str,
        story_key: str = None,
    ) -> str:
        chat_session = ChatSession(project_key=project_key, story_key=story_key)
        message = Message(
            session_id=chat_session.id, role=SenderRole(role), content=inital_message
        )
        chat_session.messages = [message]

        db.add(chat_session)
        db.commit()

        return chat_session.id

    @staticmethod
    def get_chat_session_by_project_and_story(
        db: Session, project_key: str, story_key: Optional[str] = None
    ):
        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.project_key == project_key,
                ChatSession.story_key == story_key,
            )
            .first()
        )
        if not session:
            return None

        return DefectDataService._get_chat_session_dto(session)

    @staticmethod
    def get_chat_session(db: Session, session_id: str) -> Optional[ChatSessionDto]:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            return None

        return DefectDataService._get_chat_session_dto(session)

    @staticmethod
    def _get_chat_session_dto(session: ChatSession) -> ChatSessionDto:
        return ChatSessionDto(
            id=session.id,
            project_key=session.project_key,
            story_key=session.story_key,
            messages=[
                ChatMessageDto(
                    id=message.id,
                    role=message.role.value,
                    content=message.content,
                    analysis_id=message.analysis_id,
                    created_at=message.created_at.isoformat(),
                )
                for message in session.messages
            ],
            change_proposals=[
                ChatProposalDto(
                    id=proposal.id,
                    session_id=proposal.session_id,
                    project_key=proposal.project_key,
                    type=proposal.type.value,
                    accepted=proposal.accepted,
                    created_at=proposal.created_at.isoformat(),
                    contents=[
                        ChatProposalContentDto(
                            story_key=content.story_key,
                            summary=content.summary,
                            description=content.description,
                        )
                        for content in proposal.contents
                    ],
                )
                for proposal in session.change_proposals
            ],
        )

    @staticmethod
    def get_latest_messages_after(
        db: Session, session_id: str, message_id: int
    ) -> List[ChatMessageDto]:
        """Fetch chat messages in a session after a specific message ID. Support polling."""
        messages = (
            db.query(Message)
            .filter(Message.session_id == session_id, Message.id > message_id)
            .order_by(Message.created_at.asc())
            .all()
        )
        return [
            ChatMessageDto(
                id=message.id,
                role=message.role.value,
                content=message.content,
                analysis_id=message.analysis_id,
                created_at=message.created_at.isoformat(),
            )
            for message in messages
        ]

    @staticmethod
    def propose_modifying_stories(
        db: Session, project_key: str, session_id: str, modifications: list[dict]
    ):
        keys = []
        contents = []

        for mod in modifications:
            key = mod.get("key")
            if not key:
                continue

            summary = mod.get("summary")
            description = mod.get("description")
            if not summary and not description:
                continue

            keys.append(key)
            content = StoryChangeContent(
                key=key,
                summary=summary,
                description=description,
            )
            contents.append(content)

        proposal = StoryChangeProposal(
            session_id=session_id, project_key=project_key, contents=contents
        )

        db.add(proposal)
        db.commit()

        return keys

    @staticmethod
    def _accept_updating_stories(db: Session, proposal: StoryChangeProposal):
        proposal_contents = proposal.contents
        keys = []
        valid_modifications = {}
        for content in proposal_contents:
            keys.append(content.key)
            valid_modifications[content.key] = {
                "summary": content.summary,
                "description": content.description,
            }
        issues = jira_client.search_issues(
            jql=f'project="{proposal.project_key}" AND key IN ({",".join(keys)}) AND issuetype="Story"',
            fields=["Summary", "Description"],
            max_results=len(keys),
            expand_rendered_fields=False,
        ).issues
        sub = (
            db.query(
                WorkItemVersion.key,
                func.max(WorkItemVersion.version).label("latest_version"),
            )
            .filter(WorkItemVersion.key.in_(keys))
            .group_by(WorkItemVersion.key)
            .subquery()
        )

        rows = (
            db.query(WorkItemVersion)
            .join(
                sub,
                (WorkItemVersion.key == sub.c.key)
                & (WorkItemVersion.version == sub.c.latest_version),
            )
            .all()
        )

        version_lookup = {v.key: v for v in rows}

        for issue in issues:
            # Save a version before modifying
            existing_version = version_lookup.get(issue.key)
            if existing_version:
                existing_version.version += 1
            else:
                existing_version = WorkItemVersion(
                    key=issue.key,
                    summary=issue.fields.summary,
                    description=adf_to_md(issue.fields.description),
                )
            db.add(existing_version)

            mod = valid_modifications.get(issue.key)
            update_fields = {"issue_id": issue.id, "summary": mod.get("summary")}
            updated_description = mod.get("description")
            if updated_description:
                update_fields["description"] = md_to_adf(updated_description)

            jira_client.modify_issue(**update_fields)
        proposal.accepted = True
        db.add(proposal)
        db.commit()

    @staticmethod
    def propose_creating_stories(
        db: Session, project_key: str, stories: list[dict]
    ) -> List[str]:
        content = []
        for story in stories:
            summary = story.get("summary")
            description = story.get("description")
            if summary and description:
                content.append(
                    StoryChangeContent(
                        summary=summary,
                        description=description,
                    )
                )
        proposal = StoryChangeProposal(
            project_key=project_key,
            type=ProposalType.CREATE,
            contents=content,
        )
        db.add(proposal)
        db.commit()
        return len(content)

    @staticmethod
    def _accept_creating_stories(db: Session, proposal: StoryChangeProposal):
        stories = proposal.contents
        project_key = proposal.project_key
        created_keys = jira_client.create_issues(
            issues=IssuesCreateRequest(
                **{
                    "issueUpdates": [
                        {
                            "fields": {
                                "project": {"key": project_key},
                                "summary": story["summary"],
                                "description": md_to_adf(story["description"]),
                                "issuetype": {"name": "Story"},
                            }
                        }
                        for story in stories
                    ]
                }
            )
        )
        proposal.accepted = True
        db.add(proposal)
        db.commit()

        return created_keys

    @staticmethod
    def accept_proposal(db: Session, proposal_id: str):
        proposal = (
            db.query(StoryChangeProposal)
            .filter(StoryChangeProposal.id == proposal_id)
            .first()
        )
        if not proposal:
            raise ValueError(f"Proposal with id {proposal_id} not found")

        if proposal.type == ProposalType.UPDATE:
            DefectDataService._accept_updating_stories(db, proposal)
        elif proposal.type == ProposalType.CREATE:
            DefectDataService._accept_creating_stories(db, proposal)
        else:
            raise ValueError(f"Unknown proposal type: {proposal.type}")

    @staticmethod
    def reject_proposal(db: Session, proposal_id: str):
        proposal = (
            db.query(StoryChangeProposal)
            .filter(StoryChangeProposal.id == proposal_id)
            .first()
        )
        if not proposal:
            raise ValueError(f"Proposal with id {proposal_id} not found")

        proposal.accepted = False
        db.add(proposal)
        db.commit()

    @staticmethod
    def revert_applied_proposal(db: Session, proposal_id: str):
        proposal = (
            db.query(StoryChangeProposal)
            .filter(StoryChangeProposal.id == proposal_id)
            .first()
        )
        if not proposal:
            raise ValueError(f"Proposal with id {proposal_id} not found")
        if proposal.accepted is not True:
            raise ValueError("Only accepted proposals can be reverted")

        if proposal.type != ProposalType.UPDATE:
            raise ValueError("Only UPDATE proposals can be reverted")

        for content in proposal.contents:
            latest_version = (
                db.query(WorkItemVersion)
                .filter(WorkItemVersion.key == content.key)
                .order_by(WorkItemVersion.version.desc())
                .first()
            )
            if latest_version and latest_version.version > 0:
                previous_version = (
                    db.query(WorkItemVersion)
                    .filter(
                        WorkItemVersion.key == content.key,
                        WorkItemVersion.version == latest_version.version - 1,
                    )
                    .first()
                )
                if previous_version:
                    jira_client.modify_issue(
                        issue_id=latest_version.issue_id,
                        summary=previous_version.summary,
                        description=md_to_adf(previous_version.description),
                    )
        proposal.accepted = None  # Mark as pending again
        db.add(proposal)
        db.commit()

    @staticmethod
    def create_analysis_progress_message(
        db: Session, session_id: str, analysis_id: str
    ):
        message = Message(
            session_id=session_id,
            role=SenderRole.ANALYSIS_PROGRESS,
            content="",
            analysis_id=analysis_id,
        )
        db.add(message)
        db.commit()

    @staticmethod
    def get_latest_done_analysis(
        db: Session, project_key: str, story_key: Optional[str] = None
    ) -> Optional[Analysis]:
        analysis = (
            db.query(Analysis)
            .filter(
                Analysis.project_key == project_key,
                Analysis.status == AnalysisStatus.DONE,
                Analysis.story_key == story_key if story_key else True,
            )
            .order_by(Analysis.ended_at.desc())
            .first()
        )
        return AnalysisDto(
            id=analysis.id,
            status=analysis.status.value,
            type=analysis.type.value,
            started_at=analysis.started_at.isoformat(),
            ended_at=(analysis.ended_at.isoformat() if analysis.ended_at else None),
            story_key=analysis.story_key,
            error_message=analysis.error_message,
            defects=[
                DefectDto(
                    id=defect.id,
                    type=defect.type.value,
                    severity=defect.severity.value,
                    explanation=defect.explanation,
                    confidence=defect.confidence,
                    suggested_fix=defect.suggested_fix,
                    solved=defect.solved,
                    work_item_keys=[
                        work_item.work_item_id for work_item in defect.work_item_ids
                    ],
                )
                for defect in analysis.defects
            ],
        )
