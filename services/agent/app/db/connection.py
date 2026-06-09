from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
import asyncpg
from app.config import settings

async def create_checkpointer():
    pool = await asyncpg.create_pool(dsn=settings.DATABASE_URL, min_size=1, max_size=10)
    checkpointer = AsyncPostgresSaver(pool)
    await checkpointer.setup()
    return checkpointer
