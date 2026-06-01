import type { User } from "next-auth";
import { formatPhoneInput } from "@/lib/auth/phone-normalize";

export function mapDbUserToAuth(user: {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone: string | null;
}): User {
  return {
    id: user.id,
    name: user.name ?? user.phone ?? "Пользователь",
    email: user.email,
    image: user.image,
    phone: user.phone,
  };
}

export function profileInitials(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  const source = name?.trim() || email?.trim() || "";
  if (!source || source.startsWith("+")) return "JF";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function accountDisplayName(
  name: string | null | undefined,
  phone: string | null | undefined,
): string {
  if (name && !name.startsWith("+")) return name;
  if (phone) return formatPhoneInput(phone);
  return "Пользователь";
}

export function formatAccountPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  return formatPhoneInput(phone);
}
