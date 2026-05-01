from pageindex import PageIndexClient
import pageindex.utils as utils
import json

client = PageIndexClient(
    api_key="",
    model="gemini/gemini-2.5-flash",
    retrieve_model="gemini/gemini-2.5-flash",
    workspace=".workspace",
)


doc_id = client.index(file_path="/home/lml/Downloads/report.pdf")
print(doc_id)
structure = json.loads(client.get_document_structure(doc_id))
utils.print_tree(structure)
