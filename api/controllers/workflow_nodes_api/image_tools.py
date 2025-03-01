from PIL import Image, ImageDraw, ImageFont
import io
import base64
import os
from typing import Union, BinaryIO, Any
from configs import dify_config
import traceback
def add_text_to_image(request_like: Any) -> dict:
    print(request_like)
    """
    向图片添加文字并保存到S3存储
    
    参数:
    request_like: 类似request的对象，需要实现以下方法：
        - files.get('file') 或 get_file('file')：获取图片文件
        - form.get() 或 get_form()：获取表单数据
        
    支持的输入格式：
    1. Flask Request 对象
    2. DictRequest 对象 (用于内部调用)
    3. 任何实现了类似接口的对象
    
    返回:
    dict: 包含S3中图片的URL
    
    搜索<func可以找到
    request_args = {
            "url": self.url,
            "data": self.data,
            "files": self.files,
            "json": self.json,
            "content": self.content,
            "headers": headers,
            "params": self.params,
            "timeout": (self.timeout.connect, self.timeout.read, self.timeout.write),
            "follow_redirects": True,
            "max_retries": self.max_retries,
    }
    """
    error_info = ""
    try:
        # 统一获取文件和表单数据的接口
        if hasattr(request_like, 'files'):
            image_file = request_like.files.get('file')
        else:
            image_file = request_like.get_file('file')
            
        if hasattr(request_like, 'form'):
            content = request_like.form.get('content')
            posx = request_like.form.get('posx', 0.7)
            posy = request_like.form.get('posy', 0.7)
            fontcolor = request_like.form.get('fontcolor', '#000000')
            if len(fontcolor) <= 3:
                fontcolor = '#000000'
            fontratio = request_like.form.get('fontratio', 0.04)
            try:
                fontratio = float(fontratio)
            except:
                fontratio = 0.04
        else:
            content = request_like.get_form('content')
            posx = request_like.get_form('posx', 0.7)
            posy = request_like.get_form('posy', 0.7)
            fontcolor = request_like.get_form('fontcolor', '#000000')
            if len(fontcolor) <= 3:
                fontcolor = '#000000'
            fontratio = request_like.get_form('fontratio', 0.04)
            try:
                fontratio = float(fontratio)
            except:
                fontratio = 0.04
        # 验证必需参数
        if not image_file:
            raise ValueError("缺少图片文件")
            
        if not content:
            raise ValueError("文本内容不能为空")
                
        # 处理图片输入
        if isinstance(image_file, Image.Image):
            image = image_file
        elif hasattr(image_file, 'read'):
            image = Image.open(image_file)
        elif isinstance(image_file, tuple):
            image = process_image_tuple(image_file)
        else:
            error_info += traceback.format_exc()
            return {
                "error_info": error_info,
            }
            # raise ValueError("无效的图片输入")
            
        # 验证并转换坐标参数
        try:
            posx = float(posx)
            posy = float(posy)
        except (TypeError, ValueError):
            # raise ValueError("posx和posy必须是数字")
            posx = 0.7
            posy = 0.7
        
            
        if not (0 <= posx <= 1 and 0 <= posy <= 1):
            posx = 0.7
            posy = 0.7
            # raise ValueError("posx和posy必须在0到1之间")
        
        # 创建可以在图片上绘制的对象
        draw = ImageDraw.Draw(image)
        
        # 设置字体和大小
        font_size = int(image.height * fontratio)  # 字体大小设为图片高度的指定比例
        try:
            # 首先尝试加载中文字体
            current_dir = os.path.dirname(os.path.abspath(__file__))
            font_paths = [
                os.path.join(current_dir, "SourceHanSansSC-Regular.otf"),  # 思源黑体
            ]
            
            font = None
            for font_path in font_paths:
                try:
                    font = ImageFont.truetype(font_path, font_size)
                    break
                except:
                    continue
                    
            if font is None:
                font = ImageFont.load_default()
                print("警告：未能加载中文字体，将使用默认字体")
        except Exception as e:
            print(f"加载字体出错: {str(e)}")
            font = ImageFont.load_default()
        
        # 计算文字位置
        x = int(image.width * posx)
        y = int(image.height * posy)
        
        # 计算最大行宽度（从当前x位置到图片右边界），并留出5%的边距
        margin = int(image.width * 0.05)  # 5%的边距
        max_width = image.width - x - margin  # 减去右侧边距
        
        # 使用font.getbbox()计算文字宽度并进行换行处理
        words = content
        lines = []
        current_line = ""
        
        for char in words:
            test_line = current_line + char
            bbox = font.getbbox(test_line)
            if bbox[2] <= max_width:  # bbox[2]是文字的宽度
                current_line = test_line
            else:
                lines.append(current_line)
                current_line = char
        
        if current_line:
            lines.append(current_line)
        
        # 在图片上绘制文字，每行分别绘制
        line_height = font_size * 1.2  # 设置行间距为字体大小的1.2倍
        for i, line in enumerate(lines):
            # 将颜色转换为RGB元组
            color = fontcolor.lstrip('#')
            stroke_color = (int(color[0:2], 16), int(color[2:4], 16), int(color[4:6], 16))
            text_color = (255, 255, 255)  # 白色文字
            
            # 计算当前行的y坐标
            current_y = y + i * line_height
            
            # 获取文字的边界框
            bbox = font.getbbox(line)
            padding_x = 10  # 水平方向的内边距
            padding_y = 4   # 垂直方向的内边距
            
            # 计算背景矩形的位置和大小，直接使用bbox
            rect_x = x + bbox[0] - padding_x
            rect_y = current_y + bbox[1] - padding_y
            rect_width = bbox[2] - bbox[0] + (padding_x * 2)
            rect_height = bbox[3] - bbox[1] + (padding_y * 2)
            
            # 创建半透明背景
            overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
            overlay_draw = ImageDraw.Draw(overlay)
            overlay_draw.rectangle(
                [rect_x, rect_y, rect_x + rect_width, rect_y + rect_height],
                fill=(0, 0, 0, 64)  # 黑色背景，透明度为64/255
            )
            
            # 将半透明背景合并到原图
            if image.mode == 'RGB':
                image = image.convert('RGBA')
            image = Image.alpha_composite(image, overlay)
            draw = ImageDraw.Draw(image)
            
            # 绘制描边文字
            draw.text(
                (x, current_y), 
                line, 
                font=font, 
                fill=text_color,  # 白色文字
                stroke_width=3,  # 描边宽度
                stroke_fill=stroke_color  # 描边颜色
            )

        # 如果原图是RGB模式，转换回RGB
        if image.mode == 'RGBA':
            image = image.convert('RGB')

        # 将图片转换为base64
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        buffered.seek(0)
        print("here")
        # 生成唯一的文件名
        from datetime import datetime
        import uuid
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        # 添加 bucket 子目录到文件路径
        filename = f"processed_images/{timestamp}_{unique_id}.jpg"
        
        # 获取storage实例并保存文件
        from extensions.ext_storage import storage
        storage.save(filename, buffered.getvalue())
        
        # 直接构建文件URL
        bucket = dify_config.S3_BUCKET_NAME
        region = dify_config.S3_REGION
        endpoint = dify_config.S3_ENDPOINT
        
        if False: # 不使用endpoint
            # 使用自定义endpoint，移除协议前缀
            endpoint = endpoint.replace('https://', '').replace('http://', '').rstrip('/')
            image_url = f"https://{endpoint}/{filename}"
        else:
            # 使用标准的 Virtual-hosted style URL
            image_url = f"https://{bucket}.s3.{region}.amazonaws.com/chat-bot-dalaxyai/{filename}"
        
        return {
            "image_url": image_url,
            "filename": filename
        }
        
    except Exception as e:
        error_info += traceback.format_exc()
        return {
                "error_info": error_info,
            }
        # raise ValueError(f"处理图片错误: {str(e)}") 

def process_image_tuple(image_tuple):
    """
    处理图片元组数据，直接返回PIL Image对象
    Args:
        image_tuple: 包含 (filename, binary_data, mime_type) 的元组
    Returns:
        PIL.Image: PIL图像对象
    """
    filename, binary_data, mime_type = image_tuple
    
    # 验证MIME类型
    if not mime_type.startswith('image/'):
        raise ValueError(f"不支持的文件类型: {mime_type}")
    
    # 直接从二进制数据创建PIL Image对象
    from PIL import Image
    import io
    
    image = Image.open(io.BytesIO(binary_data))
    return image 