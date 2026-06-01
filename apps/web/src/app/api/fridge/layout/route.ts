import { NextResponse } from "next/server";
import { listInventory } from "@/lib/services/inventory";
import { planFridgeLayout } from "@/lib/fridge/layout-planner";

export async function GET() {
  try {
    const items = listInventory();
    const plan = planFridgeLayout(
      items.map((i) => ({
        id: i.id,
        name: i.name,
        normalizedName: i.normalizedName,
        zone: i.zone,
        expiryAt: i.expiryAt,
      })),
    );
    return NextResponse.json(plan);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка планировки" }, { status: 500 });
  }
}
