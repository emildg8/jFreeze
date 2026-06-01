import { NextResponse } from "next/server";
import {
  listSourcesState,
  saveStoreConnections,
  saveImapConfig,
  getImapConfig,
} from "@/lib/services/store-sources";
import type { ImapConfig, StoreConnectionsMap } from "@/lib/sources/types";

export async function GET() {
  try {
    const state = listSourcesState();
    return NextResponse.json(state);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка загрузки источников" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (body.connections) {
      saveStoreConnections(body.connections as StoreConnectionsMap);
    }

    if (body.imap) {
      const incoming = body.imap as Partial<ImapConfig> & { password?: string };
      const current = getImapConfig();
      const password =
        incoming.password && incoming.password !== "••••••••"
          ? incoming.password
          : current.password;
      saveImapConfig({
        enabled: incoming.enabled ?? current.enabled,
        host: incoming.host ?? current.host,
        port: incoming.port ?? current.port,
        user: incoming.user ?? current.user,
        password,
        tls: incoming.tls ?? current.tls,
        mailbox: incoming.mailbox ?? current.mailbox,
        sinceDays: incoming.sinceDays ?? current.sinceDays,
        autoSyncIntervalHours:
          incoming.autoSyncIntervalHours ?? current.autoSyncIntervalHours,
      });
    }

    return NextResponse.json(listSourcesState());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Не удалось сохранить" }, { status: 400 });
  }
}
