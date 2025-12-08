import traceback
from fastapi import APIRouter, HTTPException, Depends
from typing import List

from app.auth_factory import get_jwt_payload
from app.service_factory import get_proposal_service

from common.schemas import BasicResponse
from .schemas import ProposalDto
from .services import ProposalService

router = APIRouter()


@router.post("/{proposal_id}/{flag}")
async def proposal_action(
    proposal_id: str,
    flag: int,
    jwt_payload: dict = Depends(get_jwt_payload),
    service: ProposalService = Depends(get_proposal_service),
):
    """Accept and apply all contents of a proposal."""
    try:
        if flag == 1:
            created_keys, updated_keys = service.accept_proposal(proposal_id)
            return BasicResponse(
                detail="Proposal accepted successfully",
                data={"created_keys": created_keys, "updated_keys": updated_keys},
            )
        elif flag == 0:
            service.reject_proposal(proposal_id)
            return BasicResponse(detail="Proposal rejected successfully")
        elif flag == -1:
            service.revert_applied_proposal(proposal_id)
            return BasicResponse(detail="Proposal reverted successfully")
        else:
            raise HTTPException(status_code=400, detail="Invalid flag value")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/contents/{proposal_content_id}/{flag}")
async def proposal_content_action(
    proposal_id: str,
    proposal_content_id: str,
    flag: int,
    jwt_payload: dict = Depends(get_jwt_payload),
    service: ProposalService = Depends(get_proposal_service),
):
    """Accept and apply a single proposal content."""
    try:
        if flag == 1:
            service.accept_proposal_content(proposal_content_id)
            return BasicResponse(detail="Proposal content accepted successfully")
        elif flag == 0:
            service.reject_proposal_content(proposal_content_id)
            return BasicResponse(detail="Proposal content rejected successfully")
        elif flag == -1:
            service.revert_applied_proposal_content(proposal_content_id)
            return BasicResponse(detail="Proposal content reverted successfully")
        else:
            raise HTTPException(status_code=400, detail="Invalid flag value")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{proposal_id}")
async def get_proposal(
    proposal_id: str,
    jwt_payload: dict = Depends(get_jwt_payload),
    service: ProposalService = Depends(get_proposal_service),
):
    """Get a proposal by its ID."""
    try:
        proposal: ProposalDto = service.get_proposal(proposal_id)
        return BasicResponse(data=proposal)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/sessions/{session_id}")
async def get_proposals_by_session(
    session_id: str,
    source: str,
    jwt_payload: dict = Depends(get_jwt_payload),
    service: ProposalService = Depends(get_proposal_service),
):
    """Get all proposals for a session and source (CHAT or ANALYSIS)."""
    if source not in ["CHAT", "ANALYSIS"]:
        raise HTTPException(
            status_code=400, detail="Source must be either 'CHAT' or 'ANALYSIS'"
        )
    try:
        proposals: List[ProposalDto] = service.get_proposals_by_session(
            session_id, source
        )
        return BasicResponse(data=proposals)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/connections/{connection_id}")
async def get_proposals_by_connection(
    connection_id: str,
    service: ProposalService = Depends(get_proposal_service),
):
    """Get all proposals for a connection."""
    try:
        dto = service.get_sessions_having_proposals(connection_id)
        return BasicResponse(data=dto)
    except ValueError as e:
        traceback.print_exc()
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
