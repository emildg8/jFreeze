import { NextResponse } from "next/server";
import { sendPhoneOtp } from "@/lib/auth/phone-otp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = sendPhoneOtp(String(body.phone ?? ""));
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      phone: result.phone,
      devCode: result.devCode,
      message: result.devCode
        ? "Код готов — введите его на экране входа"
        : "Если настроен SMS_WEBHOOK_URL, код отправлен на ваш номер",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка отправки кода" }, { status: 500 });
  }
}
