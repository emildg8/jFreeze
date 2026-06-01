"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-lg font-semibold text-slate-900">Что-то пошло не так</h1>
      <p className="max-w-sm text-sm text-slate-600">
        Попробуйте обновить страницу. Если ошибка повторяется — перезапустите{" "}
        <code className="text-xs">npm run dev</code>.
      </p>
      <Button onClick={() => reset()}>Повторить</Button>
    </div>
  );
}
