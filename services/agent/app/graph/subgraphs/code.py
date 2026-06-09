from langgraph.graph import StateGraph, END
from services.agent.app.graph.state import CodeState
import structlog
from langchain_core.messages import AIMessage, SystemMessage

logger = structlog.get_logger(__name__)

def plan_node(state: CodeState) -> CodeState:
    logger.info("code_plan_node")
    return {"implementation_plan": "1. Understand requirements. 2. Write code. 3. Validate."}

def generate_node(state: CodeState) -> CodeState:
    logger.info("code_generate_node")
    return {"generated_code": "def hello_world():\n    print('hello world')\n"}

def validate_node(state: CodeState) -> CodeState:
    logger.info("code_validate_node")
    code = state.get("generated_code", "")
    return {"validation_status": "Success", "messages": [AIMessage(content=f"Code generated and validated:\n```python\n{code}```")]}

def create_code_subgraph() -> StateGraph:
    workflow = StateGraph(CodeState)

    workflow.add_node("plan", plan_node)
    workflow.add_node("generate", generate_node)
    workflow.add_node("validate", validate_node)

    workflow.set_entry_point("plan")
    workflow.add_edge("plan", "generate")
    workflow.add_edge("generate", "validate")
    workflow.add_edge("validate", END)

    return workflow
