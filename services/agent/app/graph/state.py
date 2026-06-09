import operator
from typing import Annotated, TypedDict, Sequence
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    user_id: str
    model: str
    api_keys: dict
    mcp_tools: list
    active_artifacts: list
    conversation_id: str
    thread_id: str
