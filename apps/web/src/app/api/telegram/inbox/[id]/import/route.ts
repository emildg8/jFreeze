import { NextResponse } from "next/server";
import { resolveUserScope } from "@/lib/auth/scope";
import {
  importFamilyInboxToFridge,
  importFamilyInboxToReceipt,
} from "@/lib/services/family-inbox-import";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await resolveUserScope();
    const { id } = await context.params;
    const body = await request.json();
    const action = body.action as string;

    if (action === "fridge") {
      const zone = body.zone === "freezer" ? "freezer" : "fridge";
      const result = await importFamilyInboxToFridge(id, zone, userId);
      return NextResponse.json({
        action: "fridge",
        zone,
        ...result,
      });
    }

    if (action === "receipt" || action === "ofd") {
      const result = await importFamilyInboxToReceipt(id, userId);
      return NextResponse.json({ action: "receipt", ...result });
    }

    return NextResponse.json(
      { error: "action: fridge | receipt" },
      { status: 400 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка импорта" },
      { status: 400 },
    );
  }
}
