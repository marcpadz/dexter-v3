from typing import TypedDict, Annotated, Sequence, List, Dict, Any, Optional
import operator
from langchain_core.messages import BaseMessage

def add_messages(left: Sequence[BaseMessage], right: Sequence[BaseMessage]) -> Sequence[BaseMessage]:
    """Combine message sequences"""
    # basic merge, LangGraph usually has a built-in add_messages but this works for simple typing
    return list(left) + list(right)

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    user_id: str
    model: str
    api_keys: Dict[str, str]
    mcp_tools: List[Dict[str, Any]]
    active_artifacts: List[Dict[str, Any]]
    conversation_id: str
    thread_id: Optional[str]
