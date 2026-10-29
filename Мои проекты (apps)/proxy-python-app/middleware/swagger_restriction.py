"""Middleware для ограничения доступа к Swagger UI и ReDoc по IP-адресам"""
import ipaddress
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from logging_config import setup_logging

logger = setup_logging()

# Список разрешённых IP для доступа к Swagger UI и ReDoc
ALLOWED_SWAGGER_IPS = {
    "127.0.0.1",
    "::1",  # IPv6 localhost
    "95.161.61.87",  # IP пользователя
    "95.161.60.137",  # IP пользователя
    # Можно добавить дополнительные IP или CIDR диапазоны
    # "192.168.1.0/24",  # локальная сеть
    # "10.0.0.0/8",      # VPN сеть
}


def ip_in_allowed(cidrs: set, ip: str) -> bool:
    """Проверяет, находится ли IP в списке разрешённых (поддерживает CIDR)"""
    try:
        ip_obj = ipaddress.ip_address(ip)
        # Проверяем точные совпадения
        if ip in cidrs:
            return True
        # Проверяем CIDR диапазоны
        for cidr in cidrs:
            if '/' in cidr:
                try:
                    network = ipaddress.ip_network(cidr, strict=False)
                    if ip_obj in network:
                        return True
                except ValueError:
                    continue
        return False
    except (ValueError, AttributeError):
        return False


def get_client_ip(request: Request) -> str:
    """Получает реальный IP клиента, учитывая прокси/балансировщики"""
    # Проверяем заголовки, которые могут содержать реальный IP
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # X-Forwarded-For может содержать несколько IP через запятую
        # Берём первый (оригинальный клиент)
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    
    # Если заголовков нет, используем client.host
    if request.client:
        return request.client.host
    
    return "unknown"


class SwaggerRestrictionMiddleware(BaseHTTPMiddleware):
    """Ограничивает доступ к /docs, /redoc и /openapi.json только для разрешённых IP"""
    
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # Проверяем только запросы к документации
        if path in ("/docs", "/redoc", "/openapi.json"):
            client_ip = get_client_ip(request)
            
            if not ip_in_allowed(ALLOWED_SWAGGER_IPS, client_ip):
                logger.warning(f"Попытка доступа к документации с запрещённого IP: {client_ip} (path: {path})")
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "403 Forbidden"}
                )
            
            logger.info(f"Разрешён доступ к документации для IP: {client_ip} (path: {path})")
        
        response = await call_next(request)
        return response

