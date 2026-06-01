export function formatCartList(
  items: Array<{ name: string; suggestedQty: number; unit: string | null }>,
): string {
  const header = "🛒 jFreeze — список покупок:\n";
  const lines = items.map(
    (s) => `• ${s.name} — ${s.suggestedQty} ${s.unit ?? "шт"}`,
  );
  return header + lines.join("\n");
}

export function telegramShareUrl(text: string): string {
  return `https://t.me/share/url?text=${encodeURIComponent(text)}`;
}

export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function vkShareUrl(text: string): string {
  return `https://vk.com/share.php?comment=${encodeURIComponent(text)}`;
}
