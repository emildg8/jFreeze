/** Сообщения для пользователя вместо технических формулировок API. */

export function friendlyApiMessage(
  status: number,
  serverMessage?: string,
): string {
  if (serverMessage && !looksTechnical(serverMessage)) {
    return serverMessage;
  }

  switch (status) {
    case 0:
      return "Нет связи с jFreeze. Запустите приложение на ПК (npm run dev) или проверьте адрес сервера в настройках — для телефона нужен IP компьютера в одной Wi‑Fi сети.";
    case 400:
      return serverMessage ?? "Не удалось обработать данные. Проверьте формат чека или файла.";
    case 404:
      return "Раздел не найден. Обновите страницу.";
    case 409:
      return serverMessage ?? "Такая запись уже есть.";
    case 429:
      return "Слишком много запросов. Подождите минуту и попробуйте снова.";
    case 500:
    case 502:
    case 503:
      return "Сервер jFreeze временно недоступен. Перезапустите npm run dev или проверьте логи.";
    default:
      return serverMessage ?? `Что-то пошло не так (код ${status}). Попробуйте ещё раз.`;
  }
}

function looksTechnical(msg: string): boolean {
  return (
    /^Error:/i.test(msg) ||
    /ECONNREFUSED|fetch failed|Unexpected token/i.test(msg) ||
    msg.length > 180
  );
}
