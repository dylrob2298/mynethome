FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app source code
COPY . .

# Ensure migrations run before starting the app
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
