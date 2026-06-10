from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from app.graph.state import AgentState
from app.graph.nodes.llm import call_llm
from app.graph.nodes.router import route_after_llm
from app.graph.subgraphs.research import create_research_subgraph
from app.graph.subgraphs.code import create_code_subgraph
from app.tools import ALL_TOOLS
from typing import Dict, Any

def build_agent_graph(checkpointer=None):
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("llm", call_llm)
    workflow.add_node("tools", ToolNode(ALL_TOOLS))

    # Compile sub-graphs
    research_subgraph = create_research_subgraph().compile()
    code_subgraph = create_code_subgraph().compile()

    # Add sub-graphs as nodes
    workflow.add_node("research", research_subgraph)
    workflow.add_node("code", code_subgraph)

    # Add edges
    workflow.set_entry_point("llm")

    # Conditional routing after LLM
    workflow.add_conditional_edges(
        "llm",
        route_after_llm,
        {
            "tools": "tools",
            "research": "research",
            "code": "code",
            "__end__": END
        }
    )

    # Edges from sub-nodes back to LLM or End
    workflow.add_edge("tools", "llm")
    workflow.add_edge("research", "llm")
    workflow.add_edge("code", "llm")

    return workflow.compile(checkpointer=checkpointer)
