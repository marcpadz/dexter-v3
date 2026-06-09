import asyncpg
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from app.config import settings

# This function should be async and return the checkpointer and pool
async def create_checkpointer():
    # It takes conn_string or connection.
    # AsyncPostgresSaver.from_conn_string does exactly what we want.
    checkpointer = AsyncPostgresSaver.from_conn_string(settings.DATABASE_URL)
    await checkpointer.setup()
    return checkpointer

async def get_db_pool():
    # Helper to get a regular asyncpg pool for app queries
    return await asyncpg.create_pool(dsn=settings.DATABASE_URL)
