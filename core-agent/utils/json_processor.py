from pydantic import BaseModel


def remove_schema_titles(obj, parent_key=None):
    if isinstance(obj, dict):
        # Only remove metadata "title", never remove property names
        if parent_key != "properties":
            obj.pop("title", None)

        for key, value in list(obj.items()):
            remove_schema_titles(value, key)

    elif isinstance(obj, list):
        for item in obj:
            remove_schema_titles(item, parent_key)

    return obj


def schema_without_titles(model: BaseModel):
    schema = model.model_json_schema()
    return remove_schema_titles(schema)
