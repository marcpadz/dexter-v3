from fastapi import FastAPI
import structlog
from contextlib import asynccontextmanager
from app.db.connection import create_checkpointer
from copilotkit import CopilotKitRemoteEndpoint, LangGraphAGUIAgent
from copilotkit.integrations.fastapi import add_fastapi_endpoint
from app.graph.builder import build_agent_graph

logger = structlog.get_logger(__name__)

global_checkpointer = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("starting_agent_service")
    global global_checkpointer

    try:
        # T106: Verify PostgresSaver checkpoint integration & setup tables on startup
        global_checkpointer = await create_checkpointer()
        logger.info("checkpointer_ready")
    except Exception as e:
        logger.error("failed_to_initialize_checkpointer", error=str(e))
        # Depending on requirements, we might want to fail startup here

    yield

    # Shutdown
    logger.info("shutting_down_agent_service")

app = FastAPI(lifespan=lifespan)

@app.get("/health")
async def health():
    return {"status": "ok", "checkpointer": global_checkpointer is not None}

def build_agents(context):
    graph = build_agent_graph(checkpointer=global_checkpointer)
    return [
        LangGraphAGUIAgent(
            name="agent",
            description="The dexter agent",
            graph=graph,
            copilotkit_config={
                "checkpointer": global_checkpointer
            }
        )
    ]

sdk = CopilotKitRemoteEndpoint(agents=build_agents)
add_fastapi_endpoint(app, sdk, "/api/agent")
