"""
Конфигурация логирования
"""
import logging
import sys
from config import settings

def setup_logging():
    """Настройка логирования для приложения"""
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Уменьшаем уровень логирования для внешних библиотек
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)
    # Kafka библиотека очень много пишет в DEBUG режиме - отключаем все DEBUG сообщения
    logging.getLogger("kafka").setLevel(logging.WARNING)
    
    return logging.getLogger(__name__)

