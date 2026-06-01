import { NextResponse } from "next/server";
import { getAuthProvidersStatus } from "@/lib/auth/providers";

export async function GET() {
  const providers = getAuthProvidersStatus();
  return NextResponse.json({ providers });
}
