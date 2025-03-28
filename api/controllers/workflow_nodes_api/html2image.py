from PIL import Image
import io
import os
import traceback
import uuid
from datetime import datetime
from typing import Any
from configs import dify_config
# 使用Playwright替代WeasyPrint
from playwright.sync_api import sync_playwright
# 删除WeasyPrint相关导入
# from weasyprint import HTML, CSS
# from weasyprint.text.fonts import FontConfiguration
# 获取storage实例并保存文件
from extensions.ext_storage import storage
        
def html2image(request_like: Any, test_mode: bool = False) -> dict:
    """
    将HTML转换为图像并保存到S3存储或本地文件系统（测试模式）
    
    参数:
    request_like: 类似request的对象，需要实现以下方法：
        - form.get() 或 get_form()：获取表单数据
    test_mode: 是否为测试模式，为True时将图片保存到本地而不是S3
        
    返回:
    dict: 包含S3中图片的URL或本地文件路径，或错误信息
    """
    error_info = ""
    try:
        # 统一获取表单数据的接口
        if hasattr(request_like, 'form'):
            html_content = request_like.form.get('html_content')
            width = request_like.form.get('width', 1024)
            height = request_like.form.get('height', 768)
            test_mode = request_like.form.get('test_mode', test_mode)
        else:
            html_content = request_like.get_form('html_content')
            width = request_like.get_form('width', 1024)
            height = request_like.get_form('height', 768)
            test_mode = request_like.get_form('test_mode', test_mode)
        
        # 验证必需参数
        if not html_content:
            raise ValueError("HTML内容不能为空")
            
        # 尝试将宽度和高度转换为整数
        try:
            width = int(width)
            height = int(height)
        except (TypeError, ValueError):
            width = 1024
            height = 768
        
        # 如果test_mode是字符串，转换为布尔值
        if isinstance(test_mode, str):
            test_mode = test_mode.lower() in ('true', 'yes', '1', 't', 'y')
        
        # 保存HTML到临时文件
        temp_file = save_temp_html(html_content)
        
        # 使用Playwright生成截图
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": width, "height": height})
            page.goto(f"file://{temp_file}")
            screenshot_bytes = page.screenshot(type="jpeg", quality=100)
            browser.close()
        
        # 删除临时文件
        if os.path.exists(temp_file):
            os.remove(temp_file)
        
        # 生成唯一的文件名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        filename = f"html_images/{timestamp}_{unique_id}.jpg"
        
        if test_mode:
            # 测试模式：保存到本地
            local_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_images")
            os.makedirs(local_dir, exist_ok=True)
            local_path = os.path.join(local_dir, f"{timestamp}_{unique_id}.jpg")
            
            with open(local_path, "wb") as f:
                f.write(screenshot_bytes)
            
            return {
                "local_path": local_path,
                "filename": f"{timestamp}_{unique_id}.jpg",
                "test_mode": True
            }
        else:
            # 正常模式：保存到S3
            storage.save(filename, screenshot_bytes)
            
            # 构建文件URL
            bucket = dify_config.S3_BUCKET_NAME
            region = dify_config.S3_REGION
            
            # 使用标准的 Virtual-hosted style URL
            image_url = f"https://{bucket}.s3.{region}.amazonaws.com/chat-bot-dalaxyai/{filename}"
            
            return {
                "image_url": image_url,
                "filename": filename,
                "test_mode": False
            }
        
    except Exception as e:
        error_info += traceback.format_exc()
        traceback.print_exc()
        return {
            "error_info": error_info,
        }

def save_temp_html(html_content):
    """
    将HTML内容保存到临时文件
    
    参数:
    html_content: HTML内容字符串
    
    返回:
    str: 临时文件的路径
    """
    temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp")
    os.makedirs(temp_dir, exist_ok=True)
    
    temp_file = os.path.join(temp_dir, f"temp_{uuid.uuid4()}.html")
    with open(temp_file, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    return temp_file 