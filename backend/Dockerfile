# Start from an official Python runtime
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Prevent Python from writing pyc files and buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies (e.g., for psycopg2 / asyncpg if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Ensure entrypoint script has Unix line endings and is executable
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

# Expose the port Railway will use (defaults to 8000 but Railway uses PORT env var)
EXPOSE 8000
ENV PORT=8000

# Start Gunicorn with Uvicorn workers via entrypoint script
CMD ["/bin/sh", "entrypoint.sh"]
