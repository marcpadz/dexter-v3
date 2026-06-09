from app.tools.search import search_web
from app.tools.browser import browse_web
from app.tools.terminal import execute_code
from app.tools.files import list_files, read_file, write_file
from app.tools.delegate import delegate_to_agent
from app.tools.tasks import create_task, list_tasks, update_task, complete_task
from app.tools.composio import get_composio_tools

ALL_TOOLS = [
    search_web,
    browse_web,
    execute_code,
    list_files,
    read_file,
    write_file,
    delegate_to_agent,
    create_task,
    list_tasks,
    update_task,
    complete_task
] + get_composio_tools()
