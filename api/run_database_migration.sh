# ------- CHAT-CUSTOM -----------

export PATH="/opt/homebrew/opt/python@3.11/bin:$PATH" # 添加自己的python路径确保python可以运行且版本够新
export PATH="/opt/homebrew/bin/:$PATH"  # 添加 uvicorn 的路径
source $(/Users/bytedance/.local/bin/poetry env info --path)/bin/activate

export MIGRATION_ENABLED="true" && sh docker/entrypoint.sh