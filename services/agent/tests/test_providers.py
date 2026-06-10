import pytest
from app.models.providers import resolve_model
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI

def test_resolve_openai():
    keys = {"openai": "test-key"}
    model = resolve_model("openai/gpt-4", keys)
    assert isinstance(model, ChatOpenAI)
    assert model.model_name == "gpt-4"
    assert model.openai_api_key.get_secret_value() == "test-key"

def test_resolve_anthropic():
    keys = {"anthropic": "test-key"}
    model = resolve_model("anthropic/claude-3-opus", keys)
    assert isinstance(model, ChatAnthropic)
    assert model.model == "claude-3-opus"
    assert model.anthropic_api_key.get_secret_value() == "test-key"

def test_resolve_google():
    keys = {"google": "test-key"}
    model = resolve_model("google/gemini-pro", keys)
    assert isinstance(model, ChatGoogleGenerativeAI)
    assert model.model == "gemini-pro"

def test_resolve_groq():
    keys = {"groq": "test-key"}
    model = resolve_model("groq/llama3", keys)
    assert isinstance(model, ChatOpenAI)
    assert model.model_name == "llama3"
    assert model.openai_api_base == "https://api.groq.com/openai/v1"

def test_resolve_ollama():
    keys = {"ollama": "http://custom-host:11434/v1"}
    model = resolve_model("ollama/llama3", keys)
    assert isinstance(model, ChatOpenAI)
    assert model.model_name == "llama3"
    assert model.openai_api_base == "http://custom-host:11434/v1"

def test_missing_key_raises():
    with pytest.raises(ValueError, match="OpenAI API key is missing"):
        resolve_model("openai/gpt-4", {})

def test_unknown_provider_raises():
    with pytest.raises(ValueError, match="Unknown provider"):
        resolve_model("unknown/model", {})
