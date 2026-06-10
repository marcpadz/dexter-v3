from langgraph.graph import StateGraph, END
from app.graph.state import ResearchState
import structlog
from langchain_core.messages import AIMessage, SystemMessage

logger = structlog.get_logger(__name__)

def plan_node(state: ResearchState) -> ResearchState:
    logger.info("research_plan_node")
    # In a real implementation this would call an LLM to generate a plan based on the last user message
    return {"research_plan": "1. Identify key concepts. 2. Search web. 3. Synthesize."}

def search_node(state: ResearchState) -> ResearchState:
    logger.info("research_search_node")
    # In a real implementation this would execute search tools based on the plan
    return state

def synthesize_node(state: ResearchState) -> ResearchState:
    logger.info("research_synthesize_node")
    # In a real implementation this would summarize the findings
    results = f"Synthesized results based on plan: {state.get('research_plan', 'None')}"
    return {"synthesized_results": results, "messages": [AIMessage(content=f"Research complete: {results}")]}

def create_research_subgraph() -> StateGraph:
    workflow = StateGraph(ResearchState)

    workflow.add_node("plan", plan_node)
    workflow.add_node("search", search_node)
    workflow.add_node("synthesize", synthesize_node)

    workflow.set_entry_point("plan")
    workflow.add_edge("plan", "search")
    workflow.add_edge("search", "synthesize")
    workflow.add_edge("synthesize", END)

    return workflow
