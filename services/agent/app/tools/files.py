from langchain_core.tools import tool
import os

@tool
def list_files(path: str = ".", recursive: bool = False):
    """List files in a directory."""
    if not os.path.exists(path):
         return []
    if recursive:
         files = []
         for root, _, fnames in os.walk(path):
             for f in fnames:
                 files.append(os.path.join(root, f))
         return files
    return os.listdir(path)

@tool
def read_file(path: str):
    """Read contents of a file."""
    if not os.path.exists(path):
        return "File not found"
    with open(path, "r") as f:
        return f.read()

@tool
def write_file(path: str, content: str):
    """Write contents to a file."""
    with open(path, "w") as f:
        f.write(content)
    return f"Successfully wrote to {path}"
