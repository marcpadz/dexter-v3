from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import structlog
from app.config import settings
from copilotkit import CopilotKitSDK, LangGraphAgent
from app.db.connection import create_checkpointer
from copilotkit.integrations.fastapi import add_fastapi_endpoint
import uvicorn
from contextlib import asynccontextmanager

# Setup structured logging
structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.dict_tracebacks,
        structlog.processors.JSONRenderer()
    ]
)
logger = structlog.get_logger()

# NOTE: For T025b (Configure structlog structured JSON logging), the actual
# logging of every LLM call, tool execution, and checkpoint events
# will be done in their respective node implementations (e.g. app/graph/nodes/llm.py
# app/graph/nodes/tools.py) which will be built in the next phases. This skeleton
# initializes structlog to be used by those nodes.

# Global checkpointer
checkpointer = None

# We need a dummy graph/agent for now to instantiate LangGraphAgent
from langgraph.graph import StateGraph
from app.graph.state import AgentState

def build_dummy_graph():
    graph = StateGraph(AgentState)
    def dummy_node(state: AgentState):
        return {"messages": []}
    graph.add_node("llm", dummy_node)
    graph.set_entry_point("llm")
    # checkpointer will be set during compile, but we can compile dynamically or wait
    return graph

@asynccontextmanager
async def lifespan(app: FastAPI):
    global checkpointer
    logger.info("Initializing checkpointer")
    checkpointer = await create_checkpointer()

    # We compile the graph here if needed
    yield
    logger.info("Shutting down")


app = FastAPI(lifespan=lifespan)

# Auth middleware
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.url.path == "/api/agent":
        auth_header = request.headers.get("Authorization")
        expected_token = f"Bearer {settings.AGENT_SERVICE_SECRET}"
        if not auth_header or auth_header != expected_token:
            logger.warning("Unauthorized access attempt", path=request.url.path)
            # return JSONResponse({"detail": "Unauthorized"}, status_code=401)
            # Just rejecting simple HTTP for now, though FastAPI middleware
            # requires returning a Response.
            from fastapi.responses import JSONResponse
            return JSONResponse({"detail": "Unauthorized"}, status_code=401)
    response = await call_next(request)
    return response

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.COPILOT_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "db": "connected" if checkpointer else "pending"}

# Setup CopilotKit SDK
# Note: LangGraphAgent needs the compiled graph or name.
# We will just pass the graph builder and let it compile with checkpointer.

graph_builder = build_dummy_graph()
# compiled_graph = graph_builder.compile(checkpointer=checkpointer) - doing this at runtime is tricky if checkpointer is async initialized
# So we pass the uncompiled or simply an empty list of agents for the skeleton.
sdk = CopilotKitSDK(
    agents=[
        LangGraphAgent(
            name="dexter",
            description="Dexter AI Agent",
            graph=graph_builder.compile() # Checkpointer omitted for skeleton, add later
        )
    ]
)

add_fastapi_endpoint(app, sdk, "/api/agent")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
