FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
# RUN apt-get update && apt-get install -y \
#     gcc \
#     g++ \
#     && rm -rf /var/lib/apt/lists/*


COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV DB_HOST=mysql
ENV REDIS_HOST=redis
ENV VECTORSTORE_HOST=chroma
ENV MINIO_ENDPOINT=minio:9000
ENV NEO4J_URI=bolt://neo4j:7687

# Expose port
EXPOSE 8888

# Run the application using run.py
CMD ["python", "main.py"]

