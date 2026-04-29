import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://miniads:miniads@localhost:5432/miniads",
)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

EMBEDDING_MODEL = os.environ.get(
    "EMBEDDING_MODEL",
    "sentence-transformers/all-MiniLM-L6-v2",
)

# Embedding dimension for all-MiniLM-L6-v2
EMBEDDING_DIM = 384
