import { NextResponse } from "next/server";
import { runRemindersTick } from "@/lib/reminders/tick";

export async function POST() {
  try {
    const result = await runRemindersTick();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка напоминаний" }, { status: 500 });
  }
}
