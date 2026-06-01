import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { ensureSeedData } from "@/lib/db/seed";
import { pushSubscriptions } from "@/lib/db/schema";
import { updateSettings } from "@/lib/services/settings";

export async function POST(request: Request) {
  try {
    ensureSeedData();
    const body = await request.json();
    const endpoint = String(body.endpoint ?? "local-reminders");

    const db = getDb();
    const existing = db
      .select()
      .from(pushSubscriptions)
      .all()
      .find((s) => s.endpoint === endpoint);

    if (!existing) {
      db.insert(pushSubscriptions)
        .values({
          id: uuid(),
          endpoint,
          keysJson: JSON.stringify(body.keys ?? {}),
          createdAt: new Date(),
        })
        .run();
    }

    updateSettings({ pushEnabled: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка подписки" }, { status: 400 });
  }
}

export async function DELETE() {
  try {
    ensureSeedData();
    const db = getDb();
    const all = db.select().from(pushSubscriptions).all();
    for (const row of all) {
      db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, row.id)).run();
    }
    updateSettings({ pushEnabled: false });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка" }, { status: 400 });
  }
}
