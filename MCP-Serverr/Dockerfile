<<<<<<< HEAD
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
=======
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8001

EXPOSE 8001

# The main entrypoint for MCP-Serverr seems to be server.py or main.py
# Based on project structure, server.py uses settings.MCP_SERVER_PORT which is 8001 by default
CMD ["python", "server.py"]
>>>>>>> d4def92032fc28d74db42d93dd808f40916a24fa
