import hashlib
import shutil
import time
import zipfile
from pathlib import Path
import os
import uuid
import requests

BASE_URL = "https://mineru.net/api/v4"


def get_headers(token: str):
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def generate_data_id(file_path: Path) -> str:
    raw = str(file_path.resolve()).encode("utf-8")
    return hashlib.sha1(raw).hexdigest()[:24]


def collect_local_files(folder_path: str):
    files_payload = []
    local_files = []

    for file_path in Path(folder_path).iterdir():
        if not file_path.is_file():
            continue

        safe_name = file_path.name

        data_id = generate_data_id(file_path)

        files_payload.append({"name": safe_name, "data_id": data_id})

        local_files.append(
            {"path": file_path, "safe_name": safe_name, "data_id": data_id}
        )

    if not files_payload:
        raise ValueError("No files found in folder")

    return files_payload, local_files


def request_upload_urls(files_payload, token):
    url = f"{BASE_URL}/file-urls/batch"

    payload = {"files": files_payload, "model_version": "vlm", "language": "latin"}

    response = requests.post(url, headers=get_headers(token), json=payload)
    response.raise_for_status()

    result = response.json()

    if result["code"] != 0:
        raise RuntimeError(result["msg"])

    return result["data"]["batch_id"], result["data"]["file_urls"]


def upload_files(local_files, upload_urls):
    for file_info, upload_url in zip(local_files, upload_urls):
        with open(file_info["path"], "rb") as f:
            response = requests.put(upload_url, data=f)

        if response.status_code not in (200, 201):
            raise RuntimeError(f"Upload failed for {file_info['path'].name}")

        print(f"Uploaded: {file_info['safe_name']}")


def check_batch_status(batch_id, token):
    url = f"{BASE_URL}/extract-results/batch/{batch_id}"

    response = requests.get(url, headers=get_headers(token))
    response.raise_for_status()

    result = response.json()

    if result["code"] != 0:
        raise RuntimeError(result["msg"])

    return result["data"]["extract_result"]


def download_result(zip_url, output_path):
    response = requests.get(zip_url, stream=True)
    response.raise_for_status()

    with open(output_path, "wb") as f:
        for chunk in response.iter_content(8192):
            if chunk:
                f.write(chunk)


def extract_zip(zip_path: Path):
    extract_dir = zip_path.with_suffix("")
    extract_dir.mkdir(exist_ok=True)

    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(extract_dir)

    return extract_dir


def collect_markdown_files(results_dir: Path):
    md_dir = results_dir.parent / "references_md"
    md_dir.mkdir(exist_ok=True)

    for extracted_dir in results_dir.iterdir():
        if not extracted_dir.is_dir():
            continue

        full_md = extracted_dir / "full.md"

        if full_md.exists():
            target = md_dir / f"{extracted_dir.name}.md"
            shutil.copy2(full_md, target)
            print(f"Copied: {target}")


def poll_until_complete(batch_id, token, output_dir, poll_interval=60):
    completed = set()

    while True:
        results = check_batch_status(batch_id, token)
        all_finished = True

        for item in results:
            file_name = item["file_name"]
            state = item["state"]

            if file_name in completed:
                continue

            print(f"{file_name}: {state}")

            if state == "done":
                zip_path = output_dir / f"{Path(file_name).stem}.zip"

                download_result(item["full_zip_url"], zip_path)
                extract_zip(zip_path)

                completed.add(file_name)

            elif state == "failed":
                completed.add(file_name)
                print(f"Failed: {file_name}")

            else:
                all_finished = False

        if all_finished:
            break

        print(f"Waiting {poll_interval} seconds...")
        time.sleep(poll_interval)


def pdf2md(input_path: str, token: str, output_path: str, poll_interval: int = 60):
    os.makedirs(output_path, exist_ok=True)

    files_payload, local_files = collect_local_files(input_path)

    batch_id, upload_urls = request_upload_urls(files_payload, token)

    upload_files(local_files, upload_urls)

    poll_until_complete(batch_id, token, output_path, poll_interval)

    collect_markdown_files(output_path)

    print("All files processed.")


def pdf2md_bytes(
    files: list[tuple[str, bytes]], token: str, poll_interval: int = 10
) -> dict[str, str]:
    temp_dir = Path(f"/tmp/pdf2md_{uuid.uuid4().hex}")
    temp_dir.mkdir(exist_ok=True)

    local_files = []
    files_payload = []

    for name, content in files:
        safe_name = name
        file_path = temp_dir / safe_name

        with open(file_path, "wb") as f:
            f.write(content)

        data_id = generate_data_id(file_path)

        local_files.append(
            {"path": file_path, "safe_name": safe_name, "data_id": data_id}
        )
        files_payload.append({"name": safe_name, "data_id": data_id})

    batch_id, upload_urls = request_upload_urls(files_payload, token)

    upload_files(local_files, upload_urls)

    output_dir = temp_dir / "output"
    output_dir.mkdir(exist_ok=True)

    poll_until_complete(batch_id, token, output_dir, poll_interval)

    md_contents = {}
    for extracted_dir in output_dir.iterdir():
        if not extracted_dir.is_dir():
            continue

        full_md = extracted_dir / "full.md"

        if full_md.exists():
            with open(full_md, "r", encoding="utf-8") as f:
                md_contents[extracted_dir.name] = f.read()

    shutil.rmtree(temp_dir)

    return md_contents
