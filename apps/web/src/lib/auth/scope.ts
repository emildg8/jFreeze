import { auth } from "@/auth";

export const GUEST_USER_ID = "default";

export async function resolveUserScope(): Promise<string> {
  const session = await auth();
  return session?.user?.id ?? GUEST_USER_ID;
}
