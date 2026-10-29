<?php

header('Content-Type: application/json');
// Заголовки для dev (CORS)
// header("Access-Control-Allow-Origin: *");
// header("Access-Control-Allow-Methods: POST");
// header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Метод не поддерживается']);
    exit;
}

$requiredFields = ['name', 'phone'];
$missingFields = [];

foreach ($requiredFields as $field) {
    if (empty($_POST[$field])) {
        $missingFields[] = $field;
    }
}

if (!empty($missingFields)) {
    echo json_encode(['success' => false, 'error' => 'Не заполнены обязательные поля: ' . implode(', ', $missingFields)]);
    exit;
}

// Получаем данные из формы
$name = htmlspecialchars($_POST['name']);
$phone = htmlspecialchars($_POST['phone']);
$comment = htmlspecialchars($_POST['comment']);

// Настройки бота Telegram
$botToken = '7526537881:AAGxo2fpZB_kkDv0zEsejpy0Gw4k8LRBCaA';
// $chatId = '237982888'; dev id
$chatId = '1717505301';

// Формируем сообщение
$message = "*Новая заявка*\n";
$message .= "*Имя:* $name\n";
$message .= "*Телефон:* `$phone`\n";
$message .= $comment ? "*Описание проблемы:*\n$comment" : '';

// Отправляем в Telegram
$url = "https://api.telegram.org/bot{$botToken}/sendMessage";
$data = [
    'chat_id' => $chatId,
    'text' => $message,
    'parse_mode' => 'Markdown',
];

$options = [
    'http' => [
        'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
        'method' => 'POST',
        'content' => http_build_query($data),
    ],
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

if ($result === false) {
    echo json_encode(['success' => false, 'error' => 'Ошибка отправки в Telegram']);
    exit;
}

echo json_encode(['success' => true]);