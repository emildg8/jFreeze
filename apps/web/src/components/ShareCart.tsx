"use client";

import {
  formatCartList,
  telegramShareUrl,
  whatsappShareUrl,
} from "@/lib/share/cart-share";
import { Button } from "./ui/Button";

interface Item {
  name: string;
  suggestedQty: number;
  unit: string | null;
}

export function ShareCart({ items }: { items: Item[] }) {
  if (items.length === 0) return null;

  const text = formatCartList(items);

  async function nativeShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "jFreeze", text });
        return;
      }
      await navigator.clipboard.writeText(text);
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" className="py-2 text-xs" onClick={() => void nativeShare()}>
        Поделиться
      </Button>
      <a
        href={telegramShareUrl(text)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50"
      >
        Telegram
      </a>
      <a
        href={whatsappShareUrl(text)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50"
      >
        WhatsApp
      </a>
    </div>
  );
}
