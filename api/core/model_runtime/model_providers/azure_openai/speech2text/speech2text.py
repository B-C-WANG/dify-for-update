import copy
from typing import IO, Optional
import requests
from requests.exceptions import RequestException

from openai import AzureOpenAI

from core.model_runtime.entities.model_entities import AIModelEntity
from core.model_runtime.errors.validate import CredentialsValidateFailedError
from core.model_runtime.model_providers.__base.speech2text_model import Speech2TextModel
from core.model_runtime.model_providers.azure_openai._common import _CommonAzureOpenAI
from core.model_runtime.model_providers.azure_openai._constant import SPEECH2TEXT_BASE_MODELS, AzureBaseModel


class AzureOpenAISpeech2TextModel(_CommonAzureOpenAI, Speech2TextModel):
    """
    Model class for OpenAI Speech to text model.
    """

    def _invoke(self, model: str, credentials: dict, file: IO[bytes], user: Optional[str] = None) -> str:
        """
        Invoke speech2text model

        :param model: model name
        :param credentials: model credentials
        :param file: audio file
        :param user: unique user id
        :return: text for given audio file
        """
        return self._speech2text_invoke(model, credentials, file)

    def validate_credentials(self, model: str, credentials: dict) -> None:
        """
        Validate model credentials

        :param model: model name
        :param credentials: model credentials
        :return:
        """
        try:
            audio_file_path = self._get_demo_file_path()

            with open(audio_file_path, "rb") as audio_file:
                self._speech2text_invoke(model, credentials, audio_file)
        except Exception as ex:
            raise CredentialsValidateFailedError(str(ex))

    def _speech2text_invoke_old(self, model: str, credentials: dict, file: IO[bytes]) -> str:
        """
        Invoke speech2text model

        :param model: model name
        :param credentials: model credentials
        :param file: audio file
        :return: text for given audio file
        """
        # transform credentials to kwargs for model instance
        credentials_kwargs = self._to_credential_kwargs(credentials)

        # init model client
        client = AzureOpenAI(**credentials_kwargs)

        response = client.audio.transcriptions.create(model=model, file=file)

        return response.text
    
    def _speech2text_invoke(self, model: str, credentials: dict, file: IO[bytes]) -> str:
        """
        
        使用 Azure 语音转文本 API 调用语音识别服务，重写了原来的_speech2text_invoke，改成了自定义的方式
        # ---------------- [CHAT-CUSTOM] -------------------


        :param model: 模型名称
        :param credentials: 模型凭证
        :param file: 音频文件
        :return: 音频文件的文本转写结果
        """
        # 获取认证信息
        credentials_kwargs = self._to_credential_kwargs(credentials)
        
        # 构建 API 请求 URL
        endpoint = credentials_kwargs['azure_endpoint'].rstrip('/')
        api_version = "2024-11-15"
        url = f"{endpoint}/speechtotext/transcriptions:transcribe?api-version={api_version}"
        
        # 准备请求头
        headers = {
            'Ocp-Apim-Subscription-Key': credentials_kwargs['api_key']
        }
        
        try:
            # 准备文件数据
            files = {
                'audio': ('audio_file', file, 'application/octet-stream')
            }
            
            # 发送请求
            response = requests.post(
                url,
                headers=headers,
                files=files,
                timeout=300  # 使用固定的超时时间，而不是从 credentials_kwargs 中获取
            )
            
            # 检查响应状态
            if response.status_code == 422:
                raise ValueError("语音输入时间太短，请提供更长的语音内容") # 直接把错误信息给到前端
            
            response.raise_for_status()
            
            # 解析响应
            result = response.json()
            
            # 返回合并后的文本结果
            if 'combinedPhrases' in result and result['combinedPhrases']:
                return ' '.join(phrase['text'] for phrase in result['combinedPhrases'])
            elif 'phrases' in result and result['phrases']:
                return ' '.join(phrase['text'] for phrase in result['phrases'])
            else:
                raise ValueError("No transcription result found in response")
            
        except RequestException as e:
            if "422" in str(e):
                raise ValueError("语音输入时间太短，请提供更长的语音内容")# 直接把错误信息给到前端
            raise Exception(f"Failed to transcribe audio: {str(e)}")
        except (KeyError, ValueError) as e:
            raise Exception(f"Failed to parse transcription response: {str(e)}")
        except Exception as e:
            raise Exception(f"Unexpected error during transcription: {str(e)}")

    def get_customizable_model_schema(self, model: str, credentials: dict) -> Optional[AIModelEntity]:
        ai_model_entity = self._get_ai_model_entity(credentials["base_model_name"], model)
        if not ai_model_entity:
            return None
        return ai_model_entity.entity

    @staticmethod
    def _get_ai_model_entity(base_model_name: str, model: str) -> Optional[AzureBaseModel]:
        for ai_model_entity in SPEECH2TEXT_BASE_MODELS:
            if ai_model_entity.base_model_name == base_model_name:
                ai_model_entity_copy = copy.deepcopy(ai_model_entity)
                ai_model_entity_copy.entity.model = model
                ai_model_entity_copy.entity.label.en_US = model
                ai_model_entity_copy.entity.label.zh_Hans = model
                return ai_model_entity_copy

        return None
