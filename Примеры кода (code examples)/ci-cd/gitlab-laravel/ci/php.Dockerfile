# Образ для PHP-джобов CI: все расширения собраны заранее.
FROM php:8.4-cli-bookworm

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      git unzip libpng-dev libjpeg62-turbo-dev libfreetype6-dev libwebp-dev \
      libzip-dev libicu-dev libonig-dev $PHPIZE_DEPS \
 && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
 && docker-php-ext-install -j"$(nproc)" bcmath exif gd intl pcntl pdo_mysql sockets zip \
 && pecl install redis-6.3.0 pcov \
 && docker-php-ext-enable redis pcov \
 && apt-get purge -y --auto-remove $PHPIZE_DEPS \
 && rm -rf /var/lib/apt/lists/* /tmp/pear

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

ENV COMPOSER_ALLOW_SUPERUSER=1
