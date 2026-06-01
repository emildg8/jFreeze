import { NextResponse } from "next/server";
import { CSV_TEMPLATES } from "@/data/csv-templates";

export async function GET() {
  return NextResponse.json({ templates: CSV_TEMPLATES });
}
