from fastapi import Depends

from .analysis.services import AnalysisDataService, AnalysisRunService, DefectService
from .chat.services import ChatService, ChatDataService
from .connection.jira.services import JiraService
from .connection.ac.services import ACService
from .proposal.services import ProposalService
from .settings.services import SettingsService
from .user.services import UserService
from common.database import get_db


def get_analysis_data_service(db=Depends(get_db)):
    return AnalysisDataService(db)


def get_analysis_run_service(db=Depends(get_db)):
    return AnalysisRunService(db)


def get_chat_service(db=Depends(get_db)):
    return ChatService(db)


def get_chat_data_service(db=Depends(get_db)):
    return ChatDataService(db)


def get_proposal_service(db=Depends(get_db)):
    return ProposalService(db)


def get_jira_service(db=Depends(get_db)):
    return JiraService(db)


def get_settings_service(db=Depends(get_db)):
    return SettingsService(db)


def get_user_service(db=Depends(get_db)):
    return UserService(db)


def get_defect_service(db=Depends(get_db)):
    return DefectService(db)


def get_ac_service(db=Depends(get_db)):
    return ACService(db)
