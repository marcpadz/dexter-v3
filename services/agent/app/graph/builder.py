from langgraph.graph import StateGraph, END
from app.graph.state import AgentState
from app.graph.nodes.llm import call_llm
from app.graph.nodes.tools import execute_tools
from app.graph.nodes.router import route_after_llm
from app.tools import ALL_TOOLS

def build_agent_graph(checkpointer=None):
    graph = StateGraph(AgentState)

    graph.add_node("llm", call_llm)
    graph.add_node("tools", execute_tools(ALL_TOOLS))

    graph.set_entry_point("llm")

    graph.add_conditional_edges("llm", route_after_llm, {"tools": "tools", "end": END})
    graph.add_edge("tools", "llm")

    return graph.compile(checkpointer=checkpointer) if checkpointer else graph.compile()
