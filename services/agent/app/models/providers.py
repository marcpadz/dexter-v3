from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
import structlog

logger = structlog.get_logger(__name__)

def resolve_model(model_id: str, api_keys: dict) -> BaseChatModel:
    if not model_id:
        model_id = "openai/gpt-4o"

    parts = model_id.split("/")
    if len(parts) == 2:
        provider = parts[0]
        model_name = parts[1]
    else:
        provider = "openai"
        model_name = model_id

    logger.info("resolving_model", provider=provider, model_name=model_name)

    if provider == "openai":
        api_key = api_keys.get("openai")
        if not api_key:
            raise ValueError("OpenAI API key is missing. Please configure it in settings.")
        return ChatOpenAI(model=model_name, api_key=api_key)

    elif provider == "anthropic":
        api_key = api_keys.get("anthropic")
        if not api_key:
            raise ValueError("Anthropic API key is missing. Please configure it in settings.")
        return ChatAnthropic(model=model_name, api_key=api_key)

    elif provider == "google":
        api_key = api_keys.get("google")
        if not api_key:
            raise ValueError("Google API key is missing. Please configure it in settings.")
        return ChatGoogleGenerativeAI(model=model_name, google_api_key=api_key)

    elif provider == "groq":
        api_key = api_keys.get("groq")
        if not api_key:
            raise ValueError("Groq API key is missing. Please configure it in settings.")
        return ChatOpenAI(model=model_name, api_key=api_key, base_url="https://api.groq.com/openai/v1")

    elif provider == "mistral":
        api_key = api_keys.get("mistral")
        if not api_key:
            raise ValueError("Mistral API key is missing. Please configure it in settings.")
        return ChatOpenAI(model=model_name, api_key=api_key, base_url="https://api.mistral.ai/v1")

    elif provider == "ollama":
        base_url = api_keys.get("ollama", "http://localhost:11434/v1")
        return ChatOpenAI(model=model_name, api_key="ollama", base_url=base_url)

    else:
        raise ValueError(f"Unknown provider: {provider}")
