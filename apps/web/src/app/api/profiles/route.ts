import { NextResponse } from "next/server";
import {
  listProfiles,
  createProfile,
  switchProfile,
  deleteProfile,
} from "@/lib/services/profiles";
import { isPro } from "@/lib/services/settings";

export async function GET() {
  try {
    return NextResponse.json({
      profiles: listProfiles(),
      isPro: isPro(),
    });
  } catch {
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "switch") {
      switchProfile(body.profileId);
      return NextResponse.json({ ok: true });
    }

    if (!isPro()) {
      return NextResponse.json(
        { error: "Дополнительные профили доступны в jFreeze Pro" },
        { status: 403 },
      );
    }

    const id = createProfile(body.name ?? "Семья");
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id обязателен" }, { status: 400 });
    deleteProfile(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
