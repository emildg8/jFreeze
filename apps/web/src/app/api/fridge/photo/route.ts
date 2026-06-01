import { NextResponse } from "next/server";
import { processPhotoUpload, confirmPhotoInventory } from "@/lib/services/fridge";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const zone = (formData.get("zone") as string) || "fridge";

    if (!file) {
      return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = pathExt(file.name);
    const result = await processPhotoUpload(
      buffer,
      zone === "freezer" ? "freezer" : "fridge",
      ext,
    );

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Не удалось обработать фото" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    confirmPhotoInventory(
      body.photoId,
      body.items,
      body.zone === "freezer" ? "freezer" : "fridge",
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка подтверждения" }, { status: 400 });
  }
}

function pathExt(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot) : ".jpg";
}
