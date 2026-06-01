"use client";

import { useCallback, useState } from "react";
import { useOnMount } from "@/lib/hooks/use-on-mount";
import Link from "next/link";
import { Screen } from "@/components/ui/Screen";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { apiFetch, ApiError } from "@/lib/api/client";

interface Profile {
  id: string;
  name: string;
}

export default function FamilyPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState("default");
  const [isPro, setIsPro] = useState(false);
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState<{ variant: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [profRes, setRes] = await Promise.all([
        apiFetch<{ profiles: Profile[]; isPro: boolean }>("/api/profiles"),
        apiFetch<{ settings: { activeProfileId: string } }>("/api/settings"),
      ]);
      setProfiles(profRes.profiles ?? []);
      setIsPro(profRes.isPro ?? false);
      setActiveId(setRes.settings?.activeProfileId ?? "default");
    } catch (e) {
      setMessage({
        variant: "error",
        text: e instanceof ApiError ? e.message : "Ошибка",
      });
    }
  }, []);

  useOnMount(load);

  async function addProfile() {
    if (!newName.trim()) return;
    setMessage(null);
    try {
      await apiFetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      setNewName("");
      setMessage({ variant: "success", text: "Профиль создан" });
      await load();
    } catch (e) {
      setMessage({
        variant: "error",
        text: e instanceof ApiError ? e.message : "Ошибка",
      });
    }
  }

  async function switchTo(id: string) {
    setMessage(null);
    try {
      await apiFetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch", profileId: id }),
      });
      setMessage({ variant: "success", text: "Профиль активен" });
      await load();
    } catch (e) {
      setMessage({
        variant: "error",
        text: e instanceof ApiError ? e.message : "Ошибка",
      });
    }
  }

  return (
    <Screen>
      <PageHeader description="Отдельные холодильники и корзины для каждого профиля" />

      {!isPro && (
        <StatusBanner variant="info">
          Дополнительные профили — в{" "}
          <Link href="/pro" className="font-semibold underline">
            jFreeze Pro
          </Link>
          . Сейчас активен один профиль.
        </StatusBanner>
      )}

      {message && (
        <StatusBanner variant={message.variant}>{message.text}</StatusBanner>
      )}

      <ul className="mb-4 space-y-2">
        {profiles.map((p) => (
          <li key={p.id}>
            <Panel
              className={`flex items-center justify-between !py-3 ${p.id === activeId ? "border-sky-300 ring-1 ring-sky-100" : ""}`}
            >
              <div>
                <span className="font-medium">{p.name}</span>
                {p.id === activeId && (
                  <span className="ml-2 text-xs font-medium text-sky-600">активен</span>
                )}
              </div>
              {p.id !== activeId && (
                <Button
                  variant="secondary"
                  className="text-xs py-2"
                  onClick={() => void switchTo(p.id)}
                >
                  Выбрать
                </Button>
              )}
            </Panel>
          </li>
        ))}
      </ul>

      {isPro && (
        <Panel>
          <h2 className="mb-2 font-semibold">Новый профиль</h2>
          <Input
            className="mb-2"
            placeholder="Имя"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button onClick={() => void addProfile()}>Добавить</Button>
        </Panel>
      )}
    </Screen>
  );
}
