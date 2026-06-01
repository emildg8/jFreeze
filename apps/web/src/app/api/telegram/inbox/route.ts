import { NextResponse } from "next/server";
import { listFamilyInbox } from "@/lib/services/telegram";
import { getSettingsForUser } from "@/lib/services/settings";
import { resolveUserScope } from "@/lib/auth/scope";
import { extractOfdQrFromText } from "@/lib/receipt/ofd-qr";

export async function GET(request: Request) {
  try {
    const userId = await resolveUserScope();
    const { searchParams } = new URL(request.url);
    const profileId =
      searchParams.get("profileId") ?? getSettingsForUser(userId).activeProfileId;
    const items = listFamilyInbox(profileId, 50).map((i) => ({
      id: i.id,
      profileId: i.profileId,
      uploaderName: i.uploaderName,
      fileName: i.fileName,
      mimeType: i.mimeType,
      kind: i.kind,
      caption: i.caption,
      createdAt: i.createdAt,
      url: `/api/telegram/inbox/${i.id}`,
      hasOfdCaption: Boolean(i.caption && extractOfdQrFromText(i.caption)),
    }));
    return NextResponse.json({ items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
