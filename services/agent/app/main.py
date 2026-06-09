from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from copilotkit import CopilotKitSDK
from copilotkit.integrations.fastapi import add_fastapi_endpoint
import structlog
from app.config import settings
from app.graph.builder import build_agent_graph
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
import asyncpg

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)
logger = structlog.get_logger()

app = FastAPI(title="Dexter Agent Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.COPILOT_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != settings.AGENT_SERVICE_SECRET:
        raise HTTPException(status_code=401, detail="Invalid token")
    return credentials.credentials

@app.get("/health")
def health_check():
    return {"status": "ok"}

checkpointer = None
agent_graph = None

sdk = CopilotKitSDK(
    agents=[] # populated later
)
add_fastapi_endpoint(app, sdk, "/api/agent")

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up agent service")
    global checkpointer, agent_graph, sdk
    pool = await asyncpg.create_pool(dsn=settings.DATABASE_URL, min_size=1, max_size=10)
    checkpointer = AsyncPostgresSaver(pool)
    await checkpointer.setup()
    agent_graph = build_agent_graph(checkpointer)
    # Reinitialize SDK with agent
    from copilotkit.langchain import langgraph_agent

    dexter_agent = langgraph_agent(
        name="dexter",
        description="Dexter assistant agent",
        graph=agent_graph
    )
    sdk = CopilotKitSDK(agents=[dexter_agent])
    # Replace endpoint
    app.routes = [route for route in app.routes if not route.path == "/api/agent"]
    add_fastapi_endpoint(app, sdk, "/api/agent")
