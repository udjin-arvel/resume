FROM node:20-slim

# Устанавливаем OpenSSL для Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем исходный код
COPY . .

# Собираем TypeScript
RUN npm run build

# Порт приложения
EXPOSE 3001

# Запуск миграций и приложения
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
