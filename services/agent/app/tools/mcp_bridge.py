from langchain_core.tools import StructuredTool
import structlog
from typing import List, Dict, Any, Callable
from pydantic import create_model

logger = structlog.get_logger(__name__)

def create_mcp_tool(server_id: str, tool_schema: Dict[str, Any], execute_callback: Callable) -> StructuredTool:
    """
    Dynamically create a LangGraph Tool from an MCP tool schema.
    """
    tool_name = tool_schema.get("name")
    prefixed_name = f"mcp__{server_id}__{tool_name}"
    description = tool_schema.get("description", f"MCP Tool: {tool_name}")

    # We would parse the JSON Schema from MCP into Pydantic models here
    # For now, we mock the arguments schema

    def func(**kwargs):
        # When called, we forward this back to Next.js via the provided callback
        logger.info("executing_mcp_tool", tool=prefixed_name)
        return execute_callback(server_id, tool_name, kwargs)

    return StructuredTool.from_function(
        func=func,
        name=prefixed_name,
        description=description,
    )

def inject_mcp_tools(mcp_schemas: List[Dict[str, Any]], execute_callback: Callable) -> List[StructuredTool]:
    """Create a list of StructuredTools from MCP schemas passed from Next.js."""
    tools = []
    for schema in mcp_schemas:
        server_id = schema.get("server_id", "unknown")
        for tool_schema in schema.get("tools", []):
            tools.append(create_mcp_tool(server_id, tool_schema, execute_callback))
    return tools
