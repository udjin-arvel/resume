# Уведомления: Abstract Factory

Отправка в Email, SMS, Push и Telegram. У каждого канала своя фабрика (notifier + logger); выбор канала — через `NotificationService` и реестр `FACTORY_REGISTRY`.

```bash
py -3 -m pytest creational/abstract_factory -q
```
