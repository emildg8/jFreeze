"use client";

import { useCallback, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Screen } from "@/components/ui/Screen";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { LinkButton } from "@/components/ui/LinkButton";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import {
  formatPhoneInput,
  isPhoneComplete,
  normalizePhone,
  parseOtpCooldownSec,
} from "@/lib/auth/phone-normalize";
import { PHONE_OTP_RESEND_SEC } from "@/lib/auth/constants";
import { buildLoginTabOptions, resolveLoginTab } from "@/lib/auth/providers";
import { authErrorMessage } from "@/lib/auth/errors";
import { safeCallbackUrl } from "@/lib/auth/safe-callback";
import { useAuthProviders } from "@/lib/hooks/use-auth-providers";
import { useCountdown } from "@/lib/hooks/use-countdown";

export function LoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: sessionStatus } = useSession();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const verifyEmail = searchParams.get("verify") === "1";
  const authError = authErrorMessage(searchParams.get("error"));

  const { providers, tab, setTab, loading: providersLoading } = useAuthProviders();
  const { seconds: resendSec, setSeconds: setResendSec } = useCountdown();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(authError);
  const [info, setInfo] = useState<string | null>(
    verifyEmail ? "Проверьте почту — мы отправили ссылку для входа." : null,
  );
  const [devCode, setDevCode] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [sessionStatus, router, callbackUrl]);

  const resetPhoneFlow = useCallback(() => {
    setCodeSent(false);
    setCode("");
    setDevCode(null);
    setResendSec(0);
    setError(null);
  }, [setResendSec]);

  async function sendCode() {
    const normalized = normalizePhone(phone);
    if (!normalized || !isPhoneComplete(phone)) {
      setError("Введите полный номер: +7 и 10 цифр");
      return;
    }
    setLoading(true);
    setError(null);
    setDevCode(null);
    try {
      const res = await fetch("/api/auth/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = (await res.json()) as { error?: string; devCode?: string; message?: string };
      if (!res.ok) {
        const wait = parseOtpCooldownSec(String(data.error ?? ""));
        if (wait) setResendSec(wait);
        throw new Error(data.error ?? "Ошибка");
      }
      setCodeSent(true);
      setResendSec(PHONE_OTP_RESEND_SEC);
      if (data.devCode) setDevCode(data.devCode);
      setInfo(data.message ?? "Код отправлен");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить код");
    } finally {
      setLoading(false);
    }
  }

  async function loginPhone() {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError("Проверьте номер телефона");
      return;
    }
    if (code.trim().length < 4) {
      setError("Введите код из SMS");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await signIn("phone", {
        phone: normalized,
        code: code.trim(),
        redirect: false,
        callbackUrl,
      });
      if (result?.error) {
        setError(authErrorMessage("CredentialsSignin") ?? "Ошибка входа");
        return;
      }
      if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  async function loginEmail() {
    if (!email.trim() || !email.includes("@")) {
      setError("Введите корректный email");
      return;
    }
    if (!providers.email) {
      setError("Вход по почте пока не настроен на этом сервере.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await signIn("nodemailer", {
        email: email.trim(),
        redirect: false,
        callbackUrl,
      });
      if (result?.error) {
        setError(authErrorMessage("EmailSignin") ?? "Ошибка отправки письма");
        return;
      }
      setInfo("Проверьте почту и перейдите по ссылке для входа.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  function loginOAuth(provider: "google" | "apple") {
    if (!providers[provider]) {
      setError(
        provider === "google"
          ? "Google-вход не настроен на сервере."
          : "Apple-вход не настроен на сервере.",
      );
      return;
    }
    void signIn(provider, { callbackUrl });
  }

  const tabOptions = buildLoginTabOptions(providers);
  const activeTab = resolveLoginTab(tab, tabOptions);

  if (providersLoading) {
    return (
      <Screen>
        <PageHeader title="Вход в jFreeze" description="Загрузка способов входа…" />
        <LoadingBlock label="Подготовка формы" />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        title="Вход в jFreeze"
        description="Синхронизация заказов, холодильника и настроек между устройствами"
      />

      {error && (
        <StatusBanner variant="error" onDismiss={() => setError(null)}>
          {error}
        </StatusBanner>
      )}
      {info && (
        <StatusBanner variant="success" onDismiss={() => setInfo(null)}>
          {info}
        </StatusBanner>
      )}

      {tabOptions.length > 1 ? (
        <SegmentedControl options={tabOptions} value={activeTab} onChange={setTab} />
      ) : null}

      {activeTab === "phone" && providers.phone && (
        <Panel variant="accent" className="space-y-3">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!codeSent) void sendCode();
              else void loginPhone();
            }}
          >
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+7 900 123-45-67"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              aria-label="Телефон"
              disabled={codeSent && loading}
            />
            {!codeSent ? (
              <Button type="submit" disabled={loading || !isPhoneComplete(phone)}>
                {loading ? "Отправка…" : "Получить код"}
              </Button>
            ) : (
              <>
                <Input
                  placeholder="6 цифр из SMS"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label="Код"
                  autoFocus
                />
                {devCode && (
                  <p
                    className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"
                    role="status"
                  >
                    Режим разработки — код:{" "}
                    <strong className="tabular-nums">{devCode}</strong>
                  </p>
                )}
                <Button type="submit" disabled={loading || code.length < 4}>
                  {loading ? "Вход…" : "Войти"}
                </Button>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <button
                    type="button"
                    className="text-sky-700 underline-offset-2 hover:underline"
                    onClick={resetPhoneFlow}
                  >
                    Изменить номер
                  </button>
                  <span aria-hidden>·</span>
                  <button
                    type="button"
                    className="text-sky-700 underline-offset-2 hover:underline disabled:text-slate-400 disabled:no-underline"
                    disabled={loading || resendSec > 0}
                    onClick={() => void sendCode()}
                  >
                    {resendSec > 0
                      ? `Повтор через ${resendSec} сек`
                      : "Отправить код снова"}
                  </button>
                </div>
              </>
            )}
          </form>
        </Panel>
      )}

      {activeTab === "email" && providers.email && (
        <Panel variant="accent" className="space-y-3">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void loginEmail();
            }}
          >
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Отправка…" : "Ссылка для входа на почту"}
            </Button>
          </form>
        </Panel>
      )}

      {activeTab === "social" && (providers.google || providers.apple) && (
        <Panel variant="accent" className="space-y-2">
          {providers.google && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => loginOAuth("google")}
            >
              Войти через Google
            </Button>
          )}
          {providers.apple && (
            <Button type="button" variant="secondary" onClick={() => loginOAuth("apple")}>
              Войти через Apple
            </Button>
          )}
        </Panel>
      )}

      <Panel variant="muted" className="text-sm text-slate-600">
        <p>
          Можно пользоваться приложением <strong>без входа</strong> — данные останутся на
          этом устройстве. Вход нужен для синхронизации и отдельного кабинета.
        </p>
        <LinkButton href="/" variant="secondary" className="mt-3">
          Продолжить как гость
        </LinkButton>
      </Panel>
    </Screen>
  );
}
