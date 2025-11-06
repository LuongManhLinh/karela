from integrations.jira.client import default_client
from integrations.jira.defaults import DEFAULT_SETTINGS_KEY
from defect.agents.input_schemas import ContextInput

settings = default_client.get_settings("AF", DEFAULT_SETTINGS_KEY)
print(settings)
context = ContextInput(**settings)
print(context.model_dump_json(indent=2))