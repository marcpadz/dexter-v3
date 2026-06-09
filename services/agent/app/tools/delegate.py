from langchain_core.tools import tool
import structlog
from typing import Optional, Dict, Any

logger = structlog.get_logger(__name__)

@tool
def delegate_to_agent(agent_name: str, task: str, context: Optional[str] = None) -> str:
    """
    Delegate a task to a specialized sub-agent.

    Args:
        agent_name: The name of the agent to delegate to. Valid options: "research", "code".
        task: The specific task to delegate.
        context: Optional additional context.
    """
    logger.info("delegate_to_agent_tool_called", agent_name=agent_name, task=task)
    # The actual delegation routing is handled by the graph router.
    # This tool merely acts as a signal for the LLM to request delegation.
    # The router node will inspect the tool calls and route to the appropriate sub-graph.
    return f"Delegating to {agent_name} for task: {task}"
