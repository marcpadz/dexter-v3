import pytest
from app.tools.terminal import execute_code
from app.tools.files import write_file

def test_execute_code():
    res = execute_code.invoke({"language": "bash", "code": "echo 'hello world'"})
    assert "hello world" in res["stdout"]
    assert res["exit_code"] == 0

def test_execute_code_unsupported():
    res = execute_code.invoke({"language": "python", "code": "print('hello')"})
    assert res["exit_code"] == 1
    assert "Unsupported language" in res["stderr"]
