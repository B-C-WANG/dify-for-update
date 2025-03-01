from flask import Blueprint, request, jsonify
from libs.external_api import ExternalApi
from flask_restful import Resource
from PIL import Image, ImageDraw, ImageFont
import io
import base64
from .image_tools import add_text_to_image

bp = Blueprint("workflow_nodes_api", __name__, url_prefix="/workflow-nodes")
api = ExternalApi(bp)

class CodeExecutionApi(Resource):
    def post(self):
        # 获取请求数据
        data = request.get_json()
        print("dataALL",data)
        if not data:
            raise ValueError("请求体不能为空")

        # 提取code字段
        code = data.pop('code', None)
        if not code:
            raise ValueError("缺少code字段")

        # 准备输入数据
        input_data = data

        # 创建本地命名空间
        local_dict = {'input_data': input_data}

        try:
            # 执行代码
            exec(code, {'__builtins__': __builtins__}, local_dict)
            
            # 检查结果
            if 'result' not in local_dict:
                raise ValueError("代码必须在local_dict['result']中设置返回值")

            return local_dict['result']

        except Exception as e:
            raise ValueError(f"代码执行错误: {str(e)}")

class ImageTextApi(Resource):
    def post(self):
        try:
            return add_text_to_image(request)
        except ValueError as e:
            return {"error": str(e)}, 400
        except Exception as e:
            return {"error": f"服务器错误: {str(e)}"}, 500

# 注册API资源
api.add_resource(CodeExecutionApi, "/execute-code")
api.add_resource(ImageTextApi, "/image-add-text")

# 在这里增加图像处理的接口，用于图片粘贴文字
