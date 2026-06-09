import os
import structlog
import asyncpg
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

logger = structlog.get_logger(__name__)

# Global connection pool
_pool = None

async def get_connection_pool():
    global _pool
    if _pool is None:
        db_url = os.environ.get("DATABASE_URL")
        if not db_url:
            raise ValueError("DATABASE_URL must be set")

        logger.info("creating_db_pool")
        _pool = await asyncpg.create_pool(db_url)
    return _pool

async def create_checkpointer():
    """Create and initialize the PostgresSaver for LangGraph checkpoints."""
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL must be set")

    logger.info("initializing_checkpointer")

    # We use connection pool or conn string for PostgresSaver
    checkpointer = AsyncPostgresSaver.from_conn_string(db_url)

    # This will create the required checkpoint tables if they don't exist
    await checkpointer.setup()

    return checkpointer
