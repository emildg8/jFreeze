import { NextResponse } from "next/server";
import { listFamilyInbox } from "@/lib/services/telegram";
import { getSettings } from "@/lib/services/settings";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId") ?? getSettings().activeProfileId;
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
    }));
    return NextResponse.json({ items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
