from datetime import UTC, datetime
from typing import Any

from flask import request
from flask_login import current_user  # type: ignore
from flask_restful import Resource, inputs, marshal_with, reqparse  # type: ignore
from sqlalchemy import and_
from werkzeug.exceptions import BadRequest, Forbidden, NotFound

from controllers.console import api
from controllers.console.explore.wraps import InstalledAppResource
from controllers.console.wraps import account_initialization_required, cloud_edition_billing_resource_check
from extensions.ext_database import db
from fields.installed_app_fields import installed_app_list_fields
from libs.login import login_required
from models import App, InstalledApp, RecommendedApp, Tenant
from services.account_service import TenantService


class InstalledAppsListApi(Resource):
    @login_required
    @account_initialization_required
    @marshal_with(installed_app_list_fields) # 重要，这里返回的格式一定要改
    def get(self):
        '''
        如果是开发者，获取自己的apps
        如果是普通用户，获取自己订阅的tenant生产的apps，同时要注意publish_path树状目录
        
        在这个InstalledAppsListApi中，对于normal用户，获取用户的account的subscribed_tenant_id_list，
            然后拿到每个subscribed_tenant_id的publish_status为normal的appid，如果发现appid没有在
            这个用户的InstalledApp表中有记录，就给这个用户新建InstalledApp表的对应记录（可以参考post方法中if installed_app is None:的处理方法）
            但是last used at需要设置为2000年以前，便于标识是否用户使用过
            但是如果用户的InstalledApp表中已经有记录，而subscribed_tenant_id获得的appid没有，
            只有在用户last_used_at为2000年以前的时候，才在这个用户的install app上删除（用户使用了就不删除了）
        每次都要调用这个，因为订阅的tenant的app list会发生变化
        *注意，虽然是用户角色用的是account，但是这里还是用用户对应的tenant来记录install app
            
        '''
        # 临时代码，修改subscribed_tenant_id_list
        # current_user.subscribed_tenant_id_list = ['4aaab84b-7012-4163-8de3-275e5d6de0ff']
        # db.session.commit()
        
        if current_user.role == "developer":
            app_id = request.args.get("app_id", default=None, type=str)
            current_tenant_id = current_user.current_tenant_id

            if app_id:
                installed_apps = (
                    db.session.query(InstalledApp)
                    .filter(and_(InstalledApp.tenant_id == current_tenant_id, InstalledApp.app_id == app_id))
                    .all()
                )
            else:
                installed_apps = db.session.query(InstalledApp).filter(InstalledApp.tenant_id == current_tenant_id).all()

            current_user.role = TenantService.get_user_role(current_user, current_user.current_tenant)
            installed_app_list: list[dict[str, Any]] = [
                {
                    "id": installed_app.id,
                    "app": installed_app.app,
                    "app_owner_tenant_id": installed_app.app_owner_tenant_id,
                    "is_pinned": installed_app.is_pinned,
                    "last_used_at": installed_app.last_used_at,
                    "editable": current_user.role in {"owner", "admin"},
                    "uninstallable": current_tenant_id == installed_app.app_owner_tenant_id,
                }
                for installed_app in installed_apps
                if installed_app.app is not None
            ]
            installed_app_list.sort(
                key=lambda app: (
                    -app["is_pinned"],
                    app["last_used_at"] is None,
                    -app["last_used_at"].timestamp() if app["last_used_at"] is not None else 0,
                )
            )
        
            return {"installed_apps": installed_app_list}
        if current_user.role == "normal":
            current_tenant_id = current_user.current_tenant_id
            
            # 获取用户订阅的tenant列表
            subscribed_tenant_ids = current_user.subscribed_tenant_id_list
            print("subscribed_tenant_ids",subscribed_tenant_ids)
            # 获取所有已安装的apps
            installed_apps = db.session.query(InstalledApp).filter(
                InstalledApp.tenant_id == current_tenant_id
            ).all()
            installed_app_dict = {app.app_id: app for app in installed_apps}
            print("installed_app_dict",installed_app_dict)
            
            # 获取所有已订阅tenant的public apps
            subscribed_apps = db.session.query(App).filter(
                and_(
                    App.tenant_id.in_(subscribed_tenant_ids),
                    App.publish_status == 'enable' # normal是未发布，enable已经发布
                )
            ).all()
            # print("subscribed_apps",subscribed_apps)
            # 处理需要安装和卸载的apps
            for app in subscribed_apps:
                if app.id not in installed_app_dict:
                    # 如果订阅的app未安装，创建新的安装记录
                    new_installed_app = InstalledApp(
                        app_id=app.id,
                        tenant_id=current_tenant_id,
                        app_owner_tenant_id=app.tenant_id,
                        is_pinned=False,
                        last_used_at=datetime(1995, 1, 1, 0, 0, 0, 0, UTC).replace(tzinfo=None)
                    )
                    db.session.add(new_installed_app)
                    installed_app_dict[app.id] = new_installed_app
            
            # 处理需要删除的apps，如果tenant的app列表中没有，且用户last_used_at为2000年以前（也就是没用过）
            subscribed_app_ids = {app.id for app in subscribed_apps}
            apps_to_delete = []
            for app_id, installed_app in installed_app_dict.items():
                comparison_date = datetime(2000, 1, 1, 0, 0, 0, 0, UTC).replace(tzinfo=None)
                if app_id not in subscribed_app_ids and installed_app.last_used_at < comparison_date:
                    apps_to_delete.append(app_id)
                    
            # 在遍历结束后再进行删除操作
            for app_id in apps_to_delete:
                db.session.delete(installed_app_dict[app_id])
                installed_app_dict[app_id] = None

            db.session.commit()
            
            # 获取所有相关的tenant信息
            tenant_ids = {app.tenant_id for app in subscribed_apps}
            tenants = db.session.query(Tenant).filter(Tenant.id.in_(tenant_ids)).all()
            tenant_name_map = {str(tenant.id): tenant.name for tenant in tenants}
            
            # 准备返回数据
            current_user.role = TenantService.get_user_role(current_user, current_user.current_tenant)
            installed_app_list = [
                {
                    "id": installed_app.id,
                    "app": installed_app.app,
                    "app_owner_tenant_id": installed_app.app_owner_tenant_id,
                    "app_owner_tenant_name": tenant_name_map.get(str(installed_app.app_owner_tenant_id), ""),
                    "is_pinned": installed_app.is_pinned,
                    "last_used_at": installed_app.last_used_at,
                    "editable": current_user.role in {"owner", "admin"},
                    "uninstallable": current_tenant_id == installed_app.app_owner_tenant_id,
                    "publish_path": installed_app.app.publish_path
                }
                for installed_app in installed_app_dict.values()
                if installed_app is not None and installed_app.app is not None
            ]
            
            # 按照相同的规则排序
            installed_app_list.sort(
                key=lambda app: (
                    -app["is_pinned"],
                    app["last_used_at"] is None,
                    -app["last_used_at"].timestamp() if app["last_used_at"] is not None else 0,
                )
            )
            print("test",installed_app_list)
            return {"installed_apps": installed_app_list}

    @login_required
    @account_initialization_required
    @cloud_edition_billing_resource_check("apps")
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument("app_id", type=str, required=True, help="Invalid app_id")
        args = parser.parse_args()

        recommended_app = RecommendedApp.query.filter(RecommendedApp.app_id == args["app_id"]).first()
        if recommended_app is None:
            raise NotFound("App not found")

        current_tenant_id = current_user.current_tenant_id
        app = db.session.query(App).filter(App.id == args["app_id"]).first()

        if app is None:
            raise NotFound("App not found")

        if not app.is_public:
            raise Forbidden("You can't install a non-public app")

        installed_app = InstalledApp.query.filter(
            and_(InstalledApp.app_id == args["app_id"], InstalledApp.tenant_id == current_tenant_id)
        ).first()

        if installed_app is None:
            # todo: position
            recommended_app.install_count += 1

            new_installed_app = InstalledApp(
                app_id=args["app_id"],
                tenant_id=current_tenant_id,
                app_owner_tenant_id=app.tenant_id,
                is_pinned=False,
                last_used_at=datetime.now(UTC).replace(tzinfo=None),
            )
            db.session.add(new_installed_app)
            db.session.commit()

        return {"message": "App installed successfully"}


class InstalledAppApi(InstalledAppResource):
    """
    update and delete an installed app
    use InstalledAppResource to apply default decorators and get installed_app
    """

    def delete(self, installed_app):
        if installed_app.app_owner_tenant_id == current_user.current_tenant_id:
            raise BadRequest("You can't uninstall an app owned by the current tenant")

        db.session.delete(installed_app)
        db.session.commit()

        return {"result": "success", "message": "App uninstalled successfully"}

    def patch(self, installed_app):
        parser = reqparse.RequestParser()
        parser.add_argument("is_pinned", type=inputs.boolean)
        args = parser.parse_args()

        commit_args = False
        if "is_pinned" in args:
            installed_app.is_pinned = args["is_pinned"]
            commit_args = True

        if commit_args:
            db.session.commit()

        return {"result": "success", "message": "App info updated successfully"}


api.add_resource(InstalledAppsListApi, "/installed-apps")
api.add_resource(InstalledAppApi, "/installed-apps/<uuid:installed_app_id>")
