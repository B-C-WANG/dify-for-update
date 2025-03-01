from .app_config import DifyConfig
import os
# 显式指定env文件路径
print("LOCAL_ENV is ",os.environ.get("LOCAL_ENV",""))
if len(os.environ.get("LOCAL_ENV","")) >= 2:
    env_file = ".env.local_run"
else:
    env_file = ".env"
print("Load env file %s"%env_file)
dify_config = DifyConfig(_env_file=env_file)
print("目前local开发没有完全通，用的还是线上的.env IS_LOCAL_RUN:",os.environ.get("IS_LOCAL_RUN","No!"))
