from common.configs import MineruConfig
from utils.pdf2md import pdf2md_bytes

files = ["main.pdf"]

file_contents = []

for filename in files:
    with open(f"/home/lml/Downloads/{filename}", "rb") as f:
        file_content = f.read()
        file_contents.append((filename, file_content))

result = pdf2md_bytes(files=file_contents, token=MineruConfig.TOKEN)

for filename, markdown in result.items():
    with open("data/test/results/" + filename.replace(".pdf", ".md"), "w") as f:
        f.write(markdown)
