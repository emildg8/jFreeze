import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountCabinet } from "@/components/auth/AccountCabinet";

export const metadata: Metadata = {
  title: "Личный кабинет — jFreeze",
  description: "Профиль, способы входа и синхронизация данных",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account");
  }
  return <AccountCabinet session={session} />;
}
