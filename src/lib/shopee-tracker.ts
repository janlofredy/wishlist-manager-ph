export interface ShopeeScrapeResult {
  price?: number;
  name?: string;
  sellerRating?: number;
  unitsSold?: number;
  stockStatus?: string;
  imageUrl?: string;
  error?: string;
}

export async function fetchShopeePrice(
  url: string
): Promise<ShopeeScrapeResult> {
  if (!url || !url.includes("shopee.ph")) {
    return { error: "Invalid Shopee URL" };
  }

  try {
    // Attempt standard fetch with browser-like user agent
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fil;q=0.8",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return {
        error: `Shopee protected page (HTTP ${res.status}). Use manual price override if needed.`,
      };
    }

    const html = await res.text();

    // Heuristic 1: Extract price from meta tag or JSON-LD
    const priceMatch =
      html.match(/"price":\s*"?([0-9]+(\.[0-9]{2})?)"?/) ||
      html.match(/content="₱?([0-9,]+(\.[0-9]{2})?)"\s+property="og:price:amount"/i) ||
      html.match(/₱\s*([0-9,]+(\.[0-9]{2})?)/);

    let parsedPrice: number | undefined;
    if (priceMatch && priceMatch[1]) {
      parsedPrice = parseFloat(priceMatch[1].replace(/,/g, ""));
    }

    // Heuristic 2: Extract title
    const titleMatch =
      html.match(/<meta property="og:title" content="([^"]+)"/i) ||
      html.match(/<title>([^<]+)<\/title>/i);

    const parsedTitle = titleMatch ? titleMatch[1].trim() : undefined;

    return {
      price: parsedPrice,
      name: parsedTitle,
      stockStatus: "In Stock",
    };
  } catch (err: any) {
    return {
      error: `Shopee bot detection active or connection timed out: ${err.message}`,
    };
  }
}
