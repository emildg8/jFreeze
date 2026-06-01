import { NextResponse } from "next/server";
import {
  listProfiles,
  createProfile,
  switchProfile,
  deleteProfile,
} from "@/lib/services/profiles";
import { isPro } from "@/lib/services/settings";
import { resolveUserScope } from "@/lib/auth/scope";

export async function GET() {
  try {
    const userId = await resolveUserScope();
    return NextResponse.json({
      profiles: listProfiles(userId),
      isPro: isPro(userId),
    });
  } catch {
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveUserScope();
    const body = await request.json();

    if (body.action === "switch") {
      switchProfile(body.profileId, userId);
      return NextResponse.json({ ok: true });
    }

    if (!isPro(userId)) {
      return NextResponse.json(
        { error: "Дополнительные профили доступны в jFreeze Pro" },
        { status: 403 },
      );
    }

    const id = createProfile(body.name ?? "Семья", userId);
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await resolveUserScope();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id обязателен" }, { status: 400 });
    deleteProfile(id, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
