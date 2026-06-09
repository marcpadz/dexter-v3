import os

def get_composio_tools():
    try:
        from composio_langgraph import ComposioToolSet
    except ImportError:
        return []

    api_key = os.getenv("COMPOSIO_API_KEY")
    if not api_key:
        return []

    try:
        toolset = ComposioToolSet(api_key=api_key)
        # For MVP we just return an empty list if initialized successfully,
        # as integrating specific apps depends on user auth.
        return toolset.get_tools()
    except Exception:
        return []
