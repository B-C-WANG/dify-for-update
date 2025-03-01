import os
import sys
from dotenv import load_dotenv
import argparse
import sys
import traceback
import time
from flask import g,request
import logging

log = logging.getLogger('werkzeug') # 禁用werkzeug日志，会和我这里带延迟的日志冲突
log.disabled = True
print("Starting App")


# 增加sqlalchemy的耗时
from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault('query_start_time', []).append(time.time())

@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total = time.time() - conn.info['query_start_time'].pop()
    app.logger.debug(f"SQL: {statement[:60]}, Time: {total*1000:.2f}ms")


def is_db_command():
    if len(sys.argv) > 1 and sys.argv[0].endswith("flask") and sys.argv[1] == "db":
        return True
    return False

try:
    # create app
    if is_db_command():
        from app_factory import create_migrations_app

        app = create_migrations_app()
    else:
        # It seems that JetBrains Python debugger does not work well with gevent,
        # so we need to disable gevent in debug mode.
        # If you are using debugpy and set GEVENT_SUPPORT=True, you can debug with gevent.
        if (flask_debug := os.environ.get("FLASK_DEBUG", "0")) and flask_debug.lower() in {"false", "0", "no"}:
            from gevent import monkey  # type: ignore

            # gevent
            monkey.patch_all()

            from grpc.experimental import gevent as grpc_gevent  # type: ignore

            # grpc gevent
            grpc_gevent.init_gevent()

            import psycogreen.gevent  # type: ignore

            psycogreen.gevent.patch_psycopg()
        print("Creating App")
        from app_factory import create_app

        app = create_app()
        print("APP FINISHED ALL EXTENSION INIT")
        celery = app.extensions["celery"]
except:
    traceback.print_exc()

@app.before_request
def before_request():
    g.start_time = time.time()
    app.logger.debug(f"Processing request in pid: {os.getpid()}")
    
@app.after_request
def after_request(response):
    latency = (time.time() - g.start_time) * 1000

    # 给前端耗时打个点加到header
    response.headers.add("Server-Timing", f"request_time;dur={latency}")
    status_code = response.status_code

    # 修改日志格式，添加延迟时间
    app.logger.info(
        f'{request.remote_addr} - - [{time.strftime("%d/%b/%Y %H:%M:%S")}] '
        f' {latency:.2f}ms "{request.method} {request.path} {request.scheme.upper()}/{request.environ.get("SERVER_PROTOCOL", "")}" '
        f'{status_code} '
    )
    return response


if __name__ == "__main__":
    try:
        print(f"App starting with pid {os.getpid()}...")
        print(f"Debug mode: {os.environ.get('FLASK_DEBUG')}")
        print(f"Current working directory: {os.getcwd()}")
        app.run(host="0.0.0.0", port=5001)
        print("App started")
    except:
        traceback.print_exc()
