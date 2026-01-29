# How to run this FastAPI Application

```bash
# Install the required packages
pip install -r requirements.txt

# Run the FastAPI application
uvicorn main:app --reload

# Run the celery worker
celery -A celery_app.celery_app worker --loglevel=info
```
