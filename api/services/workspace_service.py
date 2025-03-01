from flask_login import current_user  # type: ignore

from configs import dify_config
from extensions.ext_database import db
from models.account import Tenant, TenantAccountJoin, TenantAccountJoinRole
from services.account_service import TenantService
from services.feature_service import FeatureService


class WorkspaceService:
    @classmethod
    def get_tenant_info(cls, tenant: Tenant):
        if not tenant:
            return None
        tenant_info = {
            "id": tenant.id,
            "name": tenant.name,
            "plan": tenant.plan,
            "status": tenant.status,
            "created_at": tenant.created_at,
            "in_trail": True,
            "trial_end_reason": None,
            "role": "normal",
        }

        # Get role of user
        tenant_account_join = (
            db.session.query(TenantAccountJoin)
            .filter(TenantAccountJoin.tenant_id == tenant.id, TenantAccountJoin.account_id == current_user.id)
            .first()
        )
        assert tenant_account_join is not None, "TenantAccountJoin not found"
        tenant_info["role"] = tenant_account_join.role

        can_replace_logo = FeatureService.get_features(tenant_info["id"]).can_replace_logo

        if can_replace_logo and TenantService.has_roles(
            tenant, [TenantAccountJoinRole.OWNER, TenantAccountJoinRole.ADMIN]
        ):
            base_url = dify_config.FILES_URL
            replace_webapp_logo = (
                f"{base_url}/files/workspaces/{tenant.id}/webapp-logo"
                if tenant.custom_config_dict.get("replace_webapp_logo")
                else None
            )
            remove_webapp_brand = tenant.custom_config_dict.get("remove_webapp_brand", False)

            tenant_info["custom_config"] = {
                "remove_webapp_brand": remove_webapp_brand,
                "replace_webapp_logo": replace_webapp_logo,
            }

        return tenant_info

    @classmethod
    def update_tenant_name(cls, tenant_id: str, new_name: str) -> Tenant:
        """
        Update tenant name
        :param tenant_id: Tenant id
        :param new_name: new tenant name
        :return: updated Tenant object
        """
        # 添加参数验证
        if not new_name or not new_name.strip():
            raise ValueError("工作空间名称不能为空")
        
        new_name = new_name.strip()
        if len(new_name) > 50:
            raise ValueError("工作空间名称不能超过50个字符")

        tenant = db.session.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise ValueError("找不到指定的工作空间")

        # 检查用户权限
        print("checking...",tenant.id,current_user.id)
        tenant_account_join = (
            db.session.query(TenantAccountJoin)
            .filter(
                TenantAccountJoin.tenant_id == tenant.id,
                TenantAccountJoin.account_id == current_user.id
            )
            .first()
        )
        
        if not tenant_account_join:
            raise ValueError("您不是该工作空间的成员")
      
        if tenant_account_join.role not in [TenantAccountJoinRole.OWNER.value, TenantAccountJoinRole.ADMIN.value]:
            raise ValueError("您没有修改工作空间名称的权限")
        
        try:
            tenant.name = new_name
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise ValueError(f"更新工作空间名称失败: {str(e)}")
        
        return tenant
