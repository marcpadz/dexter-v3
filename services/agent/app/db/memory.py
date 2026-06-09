from typing import List, Dict, Any, Optional
import structlog
from asyncpg import Connection
from langchain_openai import OpenAIEmbeddings

logger = structlog.get_logger(__name__)

async def generate_embedding(text: str, api_key: str) -> List[float]:
    """Generate a 1536-dimensional embedding vector for the given text."""
    if not api_key:
        raise ValueError("OpenAI API key is required to generate embeddings")

    embeddings = OpenAIEmbeddings(api_key=api_key, model="text-embedding-3-small")
    vector = await embeddings.aembed_query(text)
    return vector

async def save_memory(conn: Connection, user_id: str, content: str, embedding: List[float], tags: Optional[List[str]] = None) -> str:
    """Save a new memory to the database."""
    import json
    tags_json = json.dumps(tags) if tags else None

    # We use a string representation of the array for pgvector
    embedding_str = f"[{','.join(str(x) for x in embedding)}]"

    row = await conn.fetchrow(
        """
        INSERT INTO memories (user_id, content, embedding, tags)
        VALUES ($1, $2, $3::vector, $4::json)
        RETURNING id
        """,
        user_id, content, embedding_str, tags_json
    )

    logger.info("memory_saved", memory_id=str(row["id"]), user_id=user_id)
    return str(row["id"])

async def recall_memories(conn: Connection, user_id: str, query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
    """Recall memories similar to the query embedding using cosine similarity."""
    embedding_str = f"[{','.join(str(x) for x in query_embedding)}]"

    rows = await conn.fetch(
        """
        SELECT id, content, tags, created_at, 1 - (embedding <=> $1::vector) as similarity
        FROM memories
        WHERE user_id = $2
        ORDER BY embedding <=> $1::vector
        LIMIT $3
        """,
        embedding_str, user_id, top_k
    )

    results = []
    for row in rows:
        import json
        tags = json.loads(row["tags"]) if row["tags"] else []
        results.append({
            "id": str(row["id"]),
            "content": row["content"],
            "tags": tags,
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            "similarity": float(row["similarity"])
        })

    logger.info("memories_recalled", count=len(results), user_id=user_id)
    return results
