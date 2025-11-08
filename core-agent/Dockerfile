# Use Python 3.11 slim image as base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install python-dotenv (used but missing from requirements.txt)
RUN pip install --no-cache-dir python-dotenv

# Download NLTK data (if needed)
RUN python -m nltk.downloader punkt stopwords || true

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV RQ_WORKER_CLASS=rq.worker.SimpleWorker

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8080/')" || exit 1

# Run the application using run.py
CMD ["python", "run.py"]

