import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "jFreeze",
    version: "0.2.0-pre-alpha",
    time: new Date().toISOString(),
  });
}
