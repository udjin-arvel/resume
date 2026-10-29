const STATUS_MESSAGES: Record<number, string> = {
  400: 'Неверный запрос',
  401: 'Неверный логин или пароль',
  403: 'Доступ запрещён',
  404: 'Ресурс не найден',
  429: 'Слишком много запросов. Попробуйте позже',
  500: 'Внутренняя ошибка сервера',
  502: 'Сервер временно недоступен. Попробуйте позже',
  503: 'Сервис временно недоступен',
};

export function getFetchErrorMessage(error: unknown, fallback = 'Произошла ошибка'): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const err = error as {
    statusCode?: number;
    statusMessage?: string;
    message?: string;
    data?: unknown;
  };

  const data = err.data;

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>;
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
  }

  if (err.statusCode && STATUS_MESSAGES[err.statusCode]) {
    return STATUS_MESSAGES[err.statusCode];
  }

  if (typeof err.statusMessage === 'string' && err.statusMessage.trim()) {
    const code = err.statusCode ? ` (${err.statusCode})` : '';
    return `${err.statusMessage}${code}`;
  }

  if (typeof err.message === 'string' && err.message.trim() && !err.message.startsWith('[')) {
    return err.message;
  }

  return fallback;
}
