import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { LoadingBlock } from "@/components/ui/LoadingBlock";

export const metadata: Metadata = {
  title: "Вход — jFreeze",
  description: "Вход по телефону, почте, Google или Apple",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/account");
  }

  return (
    <Suspense fallback={<LoadingBlock label="Вход…" />}>
      <LoginPanel />
    </Suspense>
  );
}
