import pytest
from app.graph.builder import build_agent_graph

def test_graph_structure():
    graph = build_agent_graph()
    assert graph is not None
    assert "llm" in graph.nodes
    assert "tools" in graph.nodes
