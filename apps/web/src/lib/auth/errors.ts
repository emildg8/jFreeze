/** Сообщения об ошибках Auth.js для экрана входа. */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Неверный код или номер телефона.",
  OAuthSignin: "Не удалось начать вход через провайдера.",
  OAuthCallback: "Ошибка ответа от провайдера входа.",
  OAuthAccountNotLinked:
    "Этот email уже привязан к другому способу входа. Войдите тем способом, которым регистрировались.",
  EmailSignin: "Не удалось отправить письмо для входа.",
  SessionRequired: "Сначала войдите в аккаунт.",
  Default: "Не удалось войти. Попробуйте ещё раз или выберите другой способ.",
};

export function authErrorMessage(code: string | null | undefined): string | null {
  if (!code?.trim()) return null;
  return AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES.Default;
}
