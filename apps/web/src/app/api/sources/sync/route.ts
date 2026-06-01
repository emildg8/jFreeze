import { NextResponse } from "next/server";
import { getImapConfig, syncImapInbox } from "@/lib/services/store-sources";
import { isImapAutoSyncDue } from "@/lib/sources/imap-schedule";
import { resolveUserScope } from "@/lib/auth/scope";

function checkCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return true;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** Cron: GET с заголовком Authorization: Bearer CRON_SECRET */
export async function GET(request: Request) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const cfg = getImapConfig();
    if (!isImapAutoSyncDue(cfg)) {
      return NextResponse.json({
        skipped: true,
        message: "Авто-синк не требуется (выключен или ещё рано)",
      });
    }
    const result = await syncImapInbox();
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка синхронизации" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const userId = await resolveUserScope();
    const result = await syncImapInbox(userId);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка синхронизации" }, { status: 500 });
  }
}
