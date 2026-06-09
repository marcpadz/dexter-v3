from typing import Annotated, Sequence, TypedDict, Dict, Any, List
from langchain_core.messages import BaseMessage
import operator

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    user_id: str
    model: str
    api_keys: Dict[str, str]
    mcp_tools: List[str]
    active_artifacts: List[str]
    conversation_id: str
    thread_id: str

class ResearchState(AgentState):
    research_plan: str
    synthesized_results: str

class CodeState(AgentState):
    implementation_plan: str
    generated_code: str
    validation_status: str
