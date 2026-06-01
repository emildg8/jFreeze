import { NextResponse } from "next/server";
import { processPhotoUpload, confirmPhotoInventory } from "@/lib/services/fridge";
import { resolveUserScope } from "@/lib/auth/scope";
import { validateFridgeImage } from "@/lib/fridge/image-utils";

export async function POST(request: Request) {
  try {
    const userId = await resolveUserScope();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const zone = (formData.get("zone") as string) || "fridge";

    if (!file) {
      return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const check = validateFridgeImage(buffer, file.name || "photo.jpg");
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const result = await processPhotoUpload(
      buffer,
      zone === "freezer" ? "freezer" : "fridge",
      check.ext,
      userId,
    );

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    const message =
      e instanceof Error && e.message.startsWith("OpenAI Vision:")
        ? "Ошибка OpenAI — проверьте ключ в настройках"
        : "Не удалось обработать фото";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await resolveUserScope();
    const body = await request.json();
    confirmPhotoInventory(
      body.photoId,
      body.items,
      body.zone === "freezer" ? "freezer" : "fridge",
      userId,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка подтверждения" }, { status: 400 });
  }
}

