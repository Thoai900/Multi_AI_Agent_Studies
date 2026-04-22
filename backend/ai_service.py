"""AI Service for interacting with AI models"""
import time
import logging
from typing import Dict, Any, Optional
from config import AI_API_KEY, AI_MODEL_NAME

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI model interactions"""

    def __init__(self):
        """Initialize AI service"""
        self.api_key = AI_API_KEY
        self.model_name = AI_MODEL_NAME
        self.timeout = 30

    async def send_prompt(
        self,
        prompt_content: str,
        model_name: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send prompt to AI model and get response

        Args:
            prompt_content: The prompt text
            model_name: Model identifier (optional override)
            parameters: Model parameters (temperature, max_tokens, etc.)

        Returns:
            Dictionary with response data
        """
        try:
            import google.generativeai as genai

            start_time = time.time()
            model = model_name or self.model_name

            # Configure API
            genai.configure(api_key=self.api_key)

            # Get the model
            generation_model = genai.GenerativeModel(model)

            # Prepare configuration
            config_params = parameters or {}
            generation_config = genai.types.GenerationConfig(
                temperature=config_params.get("temperature", 0.7),
                max_output_tokens=config_params.get("max_tokens", 1024),
            )

            # Generate response
            response = generation_model.generate_content(
                prompt_content,
                generation_config=generation_config,
                stream=False
            )

            execution_time = time.time() - start_time

            return {
                "success": True,
                "content": response.text,
                "tokens": None,  # Google API doesn't provide token count in free tier
                "execution_time": execution_time,
                "model": model
            }

        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"AI Service Error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "execution_time": execution_time,
                "content": ""
            }

    async def validate_prompt(self, prompt_content: str) -> bool:
        """Validate prompt before sending"""
        if not prompt_content or len(prompt_content.strip()) == 0:
            return False
        if len(prompt_content) > 10000:
            return False
        return True


ai_service = AIService()
