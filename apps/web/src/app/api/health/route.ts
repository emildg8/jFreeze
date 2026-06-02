import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/app-version";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "jFreeze",
    version: APP_VERSION,
    time: new Date().toISOString(),
  });
}
