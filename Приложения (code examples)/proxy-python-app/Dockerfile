FROM python:3.11-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем системные зависимости (если нужны)
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Копируем requirements.txt и устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь код приложения
COPY . .

# Создаем директории для временных файлов и результатов
RUN mkdir -p temp_images byteplus_results byteplus_color_results

# Открываем порт
EXPOSE 8090

# Команда по умолчанию (можно переопределить в docker-compose)
CMD ["python", "main.py"]

