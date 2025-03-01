from PIL import Image, ImageDraw

# 创建一个300x200的白色背景图片
width = 300
height = 200
image = Image.new('RGB', (width, height), 'white')

# 创建画布
draw = ImageDraw.Draw(image)

# 画一个简单的边框
draw.rectangle([10, 10, width-10, height-10], outline='blue', width=2)

# 保存图片
image.save('test.png')

print("测试图片已创建：test.png") 