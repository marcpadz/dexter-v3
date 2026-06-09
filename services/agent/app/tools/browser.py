from langchain_core.tools import tool

@tool
def browse_web(url: str, action: str = "read"):
    """Browse a webpage."""
    return {"url": url, "title": "Example Page", "screenshot": "base64...", "text_content": "Content of the page."}
