from app.models.providers import resolve_model
from app.prompts.system import MAIN_AGENT_PROMPT
from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig

async def call_llm(state: dict, config: RunnableConfig | None = None):
    model = resolve_model(state.get("model", "gpt-4o"), state.get("api_keys", {}))
    tools = config.get("configurable", {}).get("tools", []) if config else []

    if tools:
        model = model.bind_tools(tools)

    messages = [SystemMessage(content=MAIN_AGENT_PROMPT)] + list(state["messages"])
    response = await model.ainvoke(messages)

    return {"messages": [response]}
