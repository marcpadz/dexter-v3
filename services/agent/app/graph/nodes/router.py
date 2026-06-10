import structlog
from app.graph.state import AgentState
from typing import Literal

logger = structlog.get_logger(__name__)

def route_after_llm(state: AgentState) -> Literal["tools", "research", "code", "__end__"]:
    messages = state.get("messages", [])
    if not messages:
        return "__end__"

    last_message = messages[-1]

    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        for tool_call in last_message.tool_calls:
            if tool_call["name"] == "delegate_to_agent":
                args = tool_call.get("args", {})
                agent_name = args.get("agent_name", "")

                if agent_name == "research":
                    logger.info("routing_to_research")
                    return "research"
                elif agent_name == "code":
                    logger.info("routing_to_code")
                    return "code"

        # If there are other tool calls, go to the generic tools node
        logger.info("routing_to_tools")
        return "tools"

    logger.info("routing_to_end")
    return "__end__"
