import type { Provider } from "next-auth/providers";
import type { User } from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import { normalizePhone } from "@/lib/auth/phone-normalize";
import { verifyPhoneOtp } from "@/lib/auth/phone-otp";
import { mapDbUserToAuth } from "@/lib/auth/profile";

async function authorizePhoneCredentials(
  credentials: Partial<Record<"phone" | "code", unknown>>,
): Promise<User | null> {
  const phone = normalizePhone(String(credentials.phone ?? ""));
  const code = String(credentials.code ?? "").trim();
  if (!phone || !code) return null;

  const result = verifyPhoneOtp(phone, code);
  return result.ok ? mapDbUserToAuth(result.user) : null;
}

export function buildAuthProviders(): Provider[] {
  const list: Provider[] = [
    Credentials({
      id: "phone",
      name: "Телефон",
      credentials: {
        phone: { label: "Телефон", type: "text" },
        code: { label: "Код", type: "text" },
      },
      authorize: authorizePhoneCredentials,
    }),
  ];

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    list.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
    list.push(
      Apple({
        clientId: process.env.AUTH_APPLE_ID,
        clientSecret: process.env.AUTH_APPLE_SECRET,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  if (process.env.SMTP_HOST && process.env.SMTP_FROM) {
    list.push(
      Nodemailer({
        server: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          auth: process.env.SMTP_USER
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD ?? "",
              }
            : undefined,
        },
        from: process.env.SMTP_FROM,
      }),
    );
  }

  return list;
}
