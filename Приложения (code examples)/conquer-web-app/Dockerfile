FROM python:3.12-slim-bookworm

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DEFAULT_TIMEOUT=600 \
    PIP_RETRIES=20

COPY requirements.txt .

# Split installs so successful layers stay cached on flaky networks
RUN pip install --no-cache-dir \
    fastapi==0.115.6 \
    "uvicorn[standard]==0.34.0" \
    jinja2==3.1.5 \
    python-multipart==0.0.20

RUN pip install --no-cache-dir \
    sqlalchemy==2.0.36 \
    asyncpg==0.30.0 \
    psycopg2-binary==2.9.10

RUN pip install --no-cache-dir \
    alembic==1.14.0 \
    celery==5.4.0 \
    redis==5.2.1

RUN pip install --no-cache-dir \
    pydantic-settings==2.7.0 \
    python-dotenv==1.0.1 \
    httpx==0.28.1 \
    openai==1.58.1

RUN pip install --no-cache-dir \
    playwright==1.49.1 \
    playwright-stealth==1.0.6 \
    setuptools==75.6.0 \
    && playwright install --with-deps chromium

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
