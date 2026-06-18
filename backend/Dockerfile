FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# gosu: safely drop from root to appuser after fixing volume permissions at runtime
RUN apt-get update && apt-get install -y --no-install-recommends gosu && \
    rm -rf /var/lib/apt/lists/*

COPY . .

RUN adduser --disabled-password --gecos "" appuser && \
    mkdir -p /app/static/blog-images && \
    chown -R appuser:appuser /app && \
    chmod +x /app/entrypoint.sh

# Container starts as root so the entrypoint can chown the named volume mount,
# then execs into appuser via gosu before uvicorn runs.
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
