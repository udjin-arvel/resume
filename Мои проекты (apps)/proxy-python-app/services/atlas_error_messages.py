"""
Справочник локализации сообщений об ошибках Atlas.
"""
from typing import Tuple


# Порядок: от более специфичных к общим; сравнение без учёта регистра, по вхождению подстроки.
_ATLAS_PROVIDER_ERRORS_RU: Tuple[Tuple[str, str], ...] = (
    (
        "Unsupported image format. Expected JPEG or PNG.",
        "Неподдерживаемый формат изображения. Ожидается JPEG или PNG.",
    ),
    (
        "Billing hard limit has been",
        "Достигнут лимит расходов на сервисе генерации. Попробуйте позже или обратитесь в поддержку.",
    ),
    (
        "Service Unavailable",
        "Сервис генерации временно недоступен. Подождите немного и попробуйте снова; если ошибка повторяется — обратитесь в поддержку.",
    ),
    (
        "503 Service Unavailable",
        "Сервис генерации временно недоступен. Подождите немного и попробуйте снова; если ошибка повторяется — обратитесь в поддержку.",
    ),
    (
        "Request timed out",
        "Превышено время ожидания ответа. Попробуйте позже.",
    ),
    (
        "Upstream too many requests",
        "Сервис генерации временно ограничил число запросов. Подождите немного и попробуйте снова.",
    ),
    (
        "The service is currently unable to handle additional requests due to server overload",
        "Сервис генерации перегружен и временно не принимает новые запросы. Попробуйте позже; если ошибка повторится, обратитесь в поддержку.",
    ),
    (
        "Model failed to generate expected content, please adjust your prompt and try again.",
        "Модель не смогла сформировать ожидаемый результат. Измените запрос и попробуйте снова.",
    ),
    (
        "The request failed because the output image may contain sensitive information.",
        "Запрос отклонён: результат может содержать чувствительную информацию.",
    ),
    (
        "Veo could not generate videos because the input image violates Vertex AI's usage guidelines. If you think this was an error, send feedback.",
        "Veo не смог создать видео: исходное изображение не соответствует правилам Vertex AI. Попробуйте другое изображение.",
    ),
    (
        "Veo could not generate 1 videos based on the prompt provided",
        "Veo не смог создать видео по вашему промпту: генерация заблокирована политикой контента. Переформулируйте промпт или попробуйте другое изображение.",
    ),
    (
        "videos are blocked, reasons:",
        "Генерация видео заблокирована моделью Veo (политика контента или несовместимый промпт). Измените промпт или исходное изображение и попробуйте снова.",
    ),
    (
        "videos were filtered out because they violated Vertex AI's usage guidelines",
        "Модель отклонила видео: оно не соответствует правилам использования Vertex AI. Измените запрос или исходные материалы и попробуйте снова.",
    ),
    (
        "The request failed because the input image may contain real person.",
        "Запрос отклонён: исходное изображение может содержать реального человека. Используйте другое изображение или модель.",
    ),
    (
        "Content violates platform security policy and has been blocked.",
        "Содержимое нарушает правила безопасности модели. Рекомендуем изменить исходные данные или модель для генерации.",
    ),
    (
        "The video width should not be less than 700px and larger than 2160px. Please check and try again.",
        "Недопустимая ширина видео: допускается от 700 до 2160 px. Проверьте исходный ролик и повторите попытку.",
    ),
    (
        "Request parameters are invalid, please check and try again.",
        "Некорректные параметры запроса к модели. Проверьте настройки (разрешение, формат, соотношение сторон) и повторите попытку.",
    ),
    (
        "Try rephrasing the prompt",
        "Измените запрос и попробуйте снова.",
    ),
)

