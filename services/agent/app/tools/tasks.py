from langchain_core.tools import tool

@tool
def create_task(title: str, description: str = "", priority: str = "medium", due_date: str = None):
    """Create a task."""
    return {"id": "1", "title": title, "status": "created"}

@tool
def list_tasks(status: str = None, project_id: str = None):
    """List tasks."""
    return []

@tool
def update_task(task_id: str, title: str = None, description: str = None, completed: bool = None, priority: str = None):
    """Update a task."""
    return {"id": task_id, "status": "updated"}

@tool
def complete_task(task_id: str):
    """Complete a task."""
    return {"id": task_id, "status": "completed"}
