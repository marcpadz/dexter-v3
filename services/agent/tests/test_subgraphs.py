import pytest
from langchain_core.messages import AIMessage, HumanMessage
from app.graph.subgraphs.research import create_research_subgraph
from app.graph.subgraphs.code import create_code_subgraph
from app.graph.nodes.router import route_after_llm

def test_research_subgraph():
    graph = create_research_subgraph().compile()

    state = {
        "messages": [HumanMessage(content="research topic X")],
        "user_id": "test_user",
        "model": "test_model",
        "api_keys": {},
        "mcp_tools": [],
        "active_artifacts": [],
        "conversation_id": "test",
        "thread_id": "test"
    }

    result = graph.invoke(state)
    assert "synthesized_results" in result
    assert len(result["messages"]) > 1 # The original message + the research completion message
    assert "Research complete" in result["messages"][-1].content

def test_code_subgraph():
    graph = create_code_subgraph().compile()

    state = {
        "messages": [HumanMessage(content="write hello world")],
        "user_id": "test_user",
        "model": "test_model",
        "api_keys": {},
        "mcp_tools": [],
        "active_artifacts": [],
        "conversation_id": "test",
        "thread_id": "test"
    }

    result = graph.invoke(state)
    assert "validation_status" in result
    assert result["validation_status"] == "Success"
    assert "hello world" in result["messages"][-1].content

def test_router_delegation():
    # Test routing to research
    research_msg = AIMessage(
        content="",
        tool_calls=[{"name": "delegate_to_agent", "args": {"agent_name": "research"}, "id": "1"}]
    )
    assert route_after_llm({"messages": [research_msg]}) == "research"

    # Test routing to code
    code_msg = AIMessage(
        content="",
        tool_calls=[{"name": "delegate_to_agent", "args": {"agent_name": "code"}, "id": "2"}]
    )
    assert route_after_llm({"messages": [code_msg]}) == "code"

    # Test normal tool
    tool_msg = AIMessage(
        content="",
        tool_calls=[{"name": "some_other_tool", "args": {}, "id": "3"}]
    )
    assert route_after_llm({"messages": [tool_msg]}) == "tools"

    # Test end
    end_msg = AIMessage(content="Hello there")
    assert route_after_llm({"messages": [end_msg]}) == "__end__"
