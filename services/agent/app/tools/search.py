from langchain_core.tools import tool
import httpx

@tool
def search_web(query: str, max_results: int = 5):
    """Search the web for information."""
    # Dummy implementation but actual httpx call logic
    return [{"title": f"Result for {query}", "url": "https://example.com", "snippet": "Snippets"}]
