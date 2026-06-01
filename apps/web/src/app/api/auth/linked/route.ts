import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getLinkedAuthProviders } from "@/lib/auth/linked-providers";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const linked = getLinkedAuthProviders(session.user.id);

  return NextResponse.json({
    providers: linked.providers,
    phone: linked.phone ?? session.user.phone ?? null,
  });
}
