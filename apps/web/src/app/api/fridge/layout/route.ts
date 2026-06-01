import { NextResponse } from "next/server";
import { listInventory } from "@/lib/services/inventory";
import { planFridgeLayout } from "@/lib/fridge/layout-planner";
import { getFridgeModelForUser } from "@/lib/services/fridge";
import { resolveUserScope } from "@/lib/auth/scope";

export async function GET() {
  try {
    const userId = await resolveUserScope();
    const items = listInventory(userId);
    const plan = planFridgeLayout(
      items.map((i) => ({
        id: i.id,
        name: i.name,
        normalizedName: i.normalizedName,
        zone: i.zone,
        expiryAt: i.expiryAt,
      })),
      getFridgeModelForUser(userId),
    );
    return NextResponse.json(plan);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка планировки" }, { status: 500 });
  }
}
