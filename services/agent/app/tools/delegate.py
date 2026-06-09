from langchain_core.tools import tool

@tool
def delegate_to_agent(agent: str, task: str, context: str = ""):
    """Delegate a task to another agent."""
    return "Not implemented yet."
