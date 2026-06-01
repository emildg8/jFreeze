import { NextResponse } from "next/server";
import { listFridgeModelPresets } from "@/lib/fridge/fridge-model";

export async function GET() {
  return NextResponse.json({ presets: listFridgeModelPresets() });
}
