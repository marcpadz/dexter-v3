from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

def resolve_model(model_id: str, api_keys: dict = None, base_url: str = None):
    keys = api_keys or {}
    if "claude" in model_id.lower() or "anthropic" in model_id.lower():
        return ChatAnthropic(model=model_id, api_key=keys.get("anthropic", ""))
    return ChatOpenAI(model=model_id, api_key=keys.get("openai", ""))
