# Описания товаров по фото

PHP-библиотека для интернет-магазина: на вход название и картинка товара, на выход продающий текст и ключевые слова. Ядро не привязано к фреймворку, рядом лежат адаптеры для Laravel, Symfony и Yii 2.

Часть [портфолио приложений](../README.md). Пакет на Packagist: [arvelov/product-description-ai](https://packagist.org/packages/arvelov/product-description-ai).

## Задача

Описание карточки нельзя каждый раз собирать руками в чате модели. Магазину нужен один вызов: фото (файл или URL), название, язык и тон — и стабильный JSON с текстом и ключевыми словами. Ключ провайдера, повтор при сбое и кэш одинакового товара остаются внутри библиотеки, а не в контроллере магазина.

## Что внутри

- Сервис генерации: промпт копирайтера, запрос в DeepSeek Vision (формат OpenAI Chat Completions), разбор ответа в описание и ключевые слова.
- Картинка как base64 или внешний HTTPS URL. Длина текста необязательна: если лимиты слов не заданы, промпт их не требует.
- Свои шаблоны промпта с плейсхолдерами языка, стиля, названия и длины.
- Кэш PSR-16 по названию и отпечатку изображения, без самого файла в ключе. TTL по умолчанию — 24 часа.
- Логи PSR-3: модель, задержка, токены, id запроса. Ключ API и содержимое картинки в лог не попадают.
- Повтор временных сбоев (429, 408, 5xx, сеть) с экспоненциальной задержкой и учётом `Retry-After`. Ошибки авторизации и валидации повторно не уходят.
- Адаптеры: провайдер и фасад Laravel, бандл Symfony, компонент Yii 2.

Ядро покрыто PHPUnit, PHPStan (уровень 8) и PHP-CS-Fixer. Живой запрос к API — отдельный smoke-тест, его включает `DEEPSEEK_SMOKE_TEST=1`.

## Стек

PHP 8.1+, PSR-18 / PSR-7, PSR-3, PSR-16, DeepSeek Vision API. Адаптеры: Laravel 10–12, Symfony 6.4–7, Yii 2.

## Запуск

```bash
composer require arvelov/product-description-ai
```

Ключ — в окружении: `DEEPSEEK_API_KEY`. HTTP-клиент любой PSR-18 (Guzzle, Symfony HttpClient, Laravel HTTP).

```php
use GuzzleHttp\Client;
use Nyholm\Psr7\Factory\Psr17Factory;
use ProductDescriptionAI\Core\Config\ClientConfig;
use ProductDescriptionAI\Core\DTO\GenerateRequest;
use ProductDescriptionAI\Core\Factory\ServiceFactory;
use ProductDescriptionAI\Core\Image\Base64Image;

$config = new ClientConfig(apiKey: getenv('DEEPSEEK_API_KEY') ?: '');
$factory = new Psr17Factory();

$service = ServiceFactory::createService(
    $config,
    new Client(['timeout' => 60]),
    $factory,
    $factory,
);

$response = $service->generate(new GenerateRequest(
    title: 'Wireless headphones',
    image: new Base64Image(base64_encode(file_get_contents('product.jpg')), 'jpeg'),
));

echo $response->description;
```

В Laravel пакет подхватывается через auto-discovery, конфиг публикуется тегом `deepseek-config`, вызов — фасад `DeepSeek`. В Symfony бандл `DeepSeekBundle` и `config/packages/deepseek.yaml`. В Yii 2 — компонент `deepSeek` в `config/web.php`.

Интерактивная форма (фото и название) на Laravel и Vite поднимается из [demo/README.md](demo/README.md):

```bash
cd demo
copy .env.example .env
docker compose up --build
```

Интерфейс — [http://localhost:3000](http://localhost:3000). В `.env` нужен `DEEPSEEK_API_KEY`.
