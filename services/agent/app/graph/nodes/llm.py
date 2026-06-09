import structlog
from typing import Dict, Any

logger = structlog.get_logger(__name__)

# Forward declare until state is defined properly
def call_llm(state: Dict[str, Any]) -> Dict[str, Any]:
    from services.agent.app.models.providers import resolve_model

    messages = state.get("messages", [])
    model_id = state.get("model", "openai/gpt-4o")
    api_keys = state.get("api_keys", {})

    try:
        model = resolve_model(model_id, api_keys)

        # Tools will be bound here when defined
        # model_with_tools = model.bind_tools(ALL_TOOLS)

        logger.info("calling_llm", model=model_id)
        # response = model_with_tools.invoke(messages)
        response = model.invoke(messages)

        return {"messages": [response]}

    except Exception as e:
        logger.error("llm_call_failed", error=str(e))
        # Return error message to gracefully handle in UI
        from langchain_core.messages import AIMessage
        error_msg = AIMessage(content=f"Error calling model {model_id}: {str(e)}")
        return {"messages": [error_msg]}
