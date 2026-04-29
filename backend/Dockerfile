FROM python:3.12-slim

WORKDIR /app

# System deps for psycopg + lightgbm
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .

RUN pip install --no-cache-dir \
    "fastapi>=0.115" "uvicorn[standard]>=0.34" "pydantic>=2.10" \
    "psycopg[binary]>=3.2" "pgvector>=0.3" "python-dotenv>=1.0" \
    "numpy>=2.0" "pandas>=2.2" "scikit-learn>=1.5" "lightgbm>=4.5" \
    "sentence-transformers>=3.0" "groq>=0.13" "httpx>=0.28"

# Pre-download the embedding model so first request doesn't pay cold-start
RUN python -c "from sentence_transformers import SentenceTransformer; \
    SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2'); \
    print('embedding model cached.')"

COPY . .

ENV PYTHONUNBUFFERED=1

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --timeout-keep-alive 300
