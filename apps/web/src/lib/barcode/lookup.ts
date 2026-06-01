/** Бесплатный lookup через Open Food Facts (опционально). */

export interface BarcodeProductInfo {
  barcode: string;
  name: string;
  brand?: string;
  quantity?: string;
}

export async function lookupBarcodeProduct(
  barcode: string,
): Promise<BarcodeProductInfo | null> {
  const code = barcode.replace(/\D/g, "");
  if (code.length < 8) return null;

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json`,
      { headers: { "User-Agent": "jFreeze/0.1 (pre-alpha)" } },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      status?: number;
      product?: {
        product_name?: string;
        brands?: string;
        quantity?: string;
      };
    };

    if (data.status !== 1 || !data.product?.product_name) return null;

    const name = data.product.product_name.trim();
    if (!name) return null;

    return {
      barcode: code,
      name,
      brand: data.product.brands?.split(",")[0]?.trim(),
      quantity: data.product.quantity,
    };
  } catch {
    return null;
  }
}
