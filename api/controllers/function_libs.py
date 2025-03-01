from .workflow_nodes_api.image_tools import add_text_to_image
class DictRequest:
    """模拟 Flask request 对象的简单实现"""
    def __init__(self, files: dict = None, form: dict = None):
        self.files = files or {}
        self.form = form or {}
        
    def get_file(self, key):
        return self.files.get(key)
        
    def get_form(self, key, default=None):
        return self.form.get(key, default)
FUNCTION_LIBS = {
    "add_text_to_image": add_text_to_image
}