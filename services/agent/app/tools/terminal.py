from langchain_core.tools import tool
import subprocess

@tool
def execute_code(language: str, code: str, timeout: int = 30):
    """Execute code in a terminal. Supports sh/bash currently."""
    if language not in ["sh", "bash"]:
        return {"stdout": "", "stderr": f"Unsupported language: {language}", "exit_code": 1}
    try:
        res = subprocess.run([language, "-c", code], capture_output=True, text=True, timeout=timeout)
        return {"stdout": res.stdout, "stderr": res.stderr, "exit_code": res.returncode}
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": "Execution timed out", "exit_code": 124}
