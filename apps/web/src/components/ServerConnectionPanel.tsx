"use client";

import { useState } from "react";
import { Panel } from "./ui/Panel";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Section } from "./ui/Section";
import { StatusBanner } from "./ui/StatusBanner";
import { checkApiHealth, getApiBase, setApiBase } from "@/lib/api/base-url";

export function ServerConnectionPanel() {
  const [url, setUrl] = useState(() =>
    typeof window !== "undefined" ? getApiBase() : "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function testConnection() {
    setChecking(true);
    setError(null);
    setMessage(null);
    const base = url.trim() || window.location.origin;
    const ok = await checkApiHealth(base);
    setChecking(false);
    if (ok) {
      setMessage(`Сервер доступен: ${base}`);
    } else {
      setError("Не удалось подключиться. Проверьте URL и что jFreeze запущен.");
    }
  }

  function save() {
    setApiBase(url.trim());
    setMessage(url.trim() ? "Адрес сохранён. Перезагрузите приложение." : "Используется встроенный сервер.");
    setError(null);
  }

  return (
    <Section
      title="Сервер jFreeze"
      description="Для Android, iOS и удалённого доступа"
    >
      <Panel>
        <p className="mb-3 text-xs leading-relaxed text-slate-600">
          Windows-программа и браузер на этом ПК используют локальный сервер автоматически.
          На телефоне укажите адрес ПК в Wi‑Fi, например{" "}
          <code className="text-[11px]">http://192.168.1.10:3000</code>.
        </p>
        <label className="block text-xs font-medium text-slate-600">
          URL сервера
          <Input
            className="mt-1 font-mono text-sm"
            placeholder="http://192.168.1.10:3000"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" disabled={checking} onClick={() => void testConnection()}>
            {checking ? "Проверка…" : "Проверить"}
          </Button>
          <Button onClick={save}>Сохранить</Button>
        </div>
        {error && (
          <div className="mt-3">
            <StatusBanner variant="error">{error}</StatusBanner>
          </div>
        )}
        {message && (
          <div className="mt-3">
            <StatusBanner variant="success">{message}</StatusBanner>
          </div>
        )}
      </Panel>
    </Section>
  );
}
