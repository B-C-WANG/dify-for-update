from dify_app import DifyApp
from models import db


def init_app(app: DifyApp):
    SQLALCHEMY_POOL_RECYCLE = 35  # value less than backend’s timeout
    SQLALCHEMY_POOL_TIMEOUT = 7  # value less than backend’s timeout
    SQLALCHEMY_PRE_PING = True
    SQLALCHEMY_ENGINE_OPTIONS = {'pool_recycle': SQLALCHEMY_POOL_RECYCLE, 'pool_timeout': SQLALCHEMY_POOL_TIMEOUT,
                                 'pool_pre_ping': SQLALCHEMY_PRE_PING}
    # 追加配置修改，修改数据库连接参数
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] =SQLALCHEMY_ENGINE_OPTIONS
    db.init_app(app)


