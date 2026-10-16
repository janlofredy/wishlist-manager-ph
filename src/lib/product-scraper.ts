export interface ProductScrapeResult {
  title?: string;
  price?: number;
  priceRange?: string; // e.g. "₱450 - ₱1,250"
  hasVariations?: boolean;
  selectedModelId?: string;
  imageUrl?: string;
  source?: "shopee" | "lazada" | "generic";
  suggestedCategory?: string;
  suggestedPriority?: number; // 1: Quick Win, 2: Utility & Hobby, 3: Mid-Cost Want, 4: Large Purchase
  error?: string;
}

// Automatically categorize and assign priority based on product name keywords
export function inferCategoryAndPriority(productName: string, price: number = 0): {
  category: string;
  priority: number;
} {
  const name = productName.toLowerCase();

  let category = "General";
  let priority = 2; // Default: Utility & Hobby

  // Keyword rules for categories
  if (name.includes("oral-b") || name.includes("toothbrush") || name.includes("shampoo") || name.includes("skincare") || name.includes("serum") || name.includes("perfume") || name.includes("lotion") || name.includes("sunscreen")) {
    category = "Personal Care";
  } else if (name.includes("usb") || name.includes("sata") || name.includes("cable") || name.includes("charger") || name.includes("keyboard") || name.includes("mouse") || name.includes("monitor") || name.includes("adapter") || name.includes("earphone") || name.includes("headset") || name.includes("bluetooth") || name.includes("laptop") || name.includes("ram") || name.includes("ssd")) {
    category = "Electronics";
  } else if (name.includes("screw") || name.includes("stripper") || name.includes("wrench") || name.includes("drill") || name.includes("hammer") || name.includes("tape") || name.includes("pliers") || name.includes("soldering")) {
    category = "Tools";
  } else if (name.includes("arm") || name.includes("desk") || name.includes("lamp") || name.includes("chair") || name.includes("mat") || name.includes("stand")) {
    category = "Desk Setup";
  } else if (name.includes("aquarium") || name.includes("tank") || name.includes("filter") || name.includes("fish") || name.includes("tabs")) {
    category = "Aquarium";
  } else if (name.includes("car") || name.includes("wiper") || name.includes("dashcam") || name.includes("tire") || name.includes("motorcycle")) {
    category = "Automotive";
  } else if (name.includes("gel blaster") || name.includes("rc ") || name.includes("drone") || name.includes("gunpla") || name.includes("lego") || name.includes("toy") || name.includes("game")) {
    category = "Hobby";
  } else if (name.includes("coffee") || name.includes("grinder") || name.includes("kettle") || name.includes("pan") || name.includes("pot") || name.includes("knife") || name.includes("espresso")) {
    category = "Kitchen";
  } else if (name.includes("tent") || name.includes("blanket") || name.includes("camping") || name.includes("backpack") || name.includes("outdoor")) {
    category = "Outdoor";
  }

  // Priority assignment based on price + item nature
  if (price > 0) {
    if (price < 1500) {
      priority = 1; // Priority 1: Quick Wins (< ₱1,500)
    } else if (price < 5000) {
      priority = 2; // Priority 2: Utility & Hobby (₱1,500 - ₱5,000)
    } else if (price < 15000) {
      priority = 3; // Priority 3: Mid-Cost Wants (₱5,000 - ₱15,000)
    } else {
      priority = 4; // Priority 4: Large Purchases (₱15,000+)
    }
  }

  return { category, priority };
}

// Scrape Shopee PH or Lazada PH listing URL
export async function scrapeProductUrl(url: string): Promise<ProductScrapeResult> {
  const isShopee = url.includes("shopee.ph");
  const isLazada = url.includes("lazada.com.ph") || url.includes("lazada.ph");

  if (!isShopee && !isLazada) {
    return { error: "Please enter a valid Shopee Philippines or Lazada Philippines URL" };
  }

  const source = isShopee ? "shopee" : "lazada";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fil;q=0.8",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return {
        source,
        error: `Could not auto-fetch (HTTP ${res.status}). You can enter the title & price manually!`,
      };
    }

    const html = await res.text();

    // 1. Extract Price & Variation Price Range
    let price: number | undefined;
    let priceRange: string | undefined;
    let hasVariations = false;

    // Detect price ranges like ₱350 - ₱1,200
    const rangeMatch = html.match(/₱\s*([0-9,]+(\.[0-9]{2})?)\s*-\s*₱?\s*([0-9,]+(\.[0-9]{2})?)/i);
    if (rangeMatch) {
      priceRange = `₱${rangeMatch[1]} - ₱${rangeMatch[3]}`;
      hasVariations = true;
    }

    // Shopee JSON-LD or meta og:price
    const pricePatterns = [
      /"price":\s*"?([0-9]+(\.[0-9]{2})?)"?/,
      /property="og:price:amount"\s+content="₱?([0-9,]+(\.[0-9]{2})?)"/i,
      /content="₱?([0-9,]+(\.[0-9]{2})?)"\s+property="og:price:amount"/i,
      /class="[a-zA-Z0-9_-]*price[a-zA-Z0-9_-]*"[^>]*>₱?\s*([0-9,]+(\.[0-9]{2})?)/i,
      /₱\s*([0-9,]+(\.[0-9]{2})?)/,
    ];

    for (const pat of pricePatterns) {
      const match = html.match(pat);
      if (match && match[1]) {
        const parsed = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(parsed) && parsed > 0) {
          price = parsed;
          break;
        }
      }
    }

    // Check if the URL contains specific variation parameters
    // Shopee often includes ?modelid=... or ?sp_atk=... or i.shopId.itemId?modelId=...
    const urlObj = new URL(url);
    const selectedModelId = urlObj.searchParams.get("modelid") || urlObj.searchParams.get("variation") || undefined;
    if (selectedModelId) {
      hasVariations = true;
    }

    // 2. Extract Title
    let title: string | undefined;
    const titlePatterns = [
      /<meta property="og:title" content="([^"]+)"/i,
      /<meta name="twitter:title" content="([^"]+)"/i,
      /<title>([^<]+)<\/title>/i,
    ];

    for (const pat of titlePatterns) {
      const match = html.match(pat);
      if (match && match[1]) {
        let clean = match[1].replace(/\|.*$/, "").replace(/Shopee Philippines.*$/i, "").replace(/Lazada.*$/i, "").trim();
        if (clean.length > 3) {
          title = clean;
          break;
        }
      }
    }

    // 3. Extract Image
    let imageUrl: string | undefined;
    const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
    if (imgMatch && imgMatch[1]) {
      imageUrl = imgMatch[1];
    }

    const { category, priority } = inferCategoryAndPriority(title || "", price || 0);

    return {
      title,
      price,
      priceRange,
      hasVariations,
      selectedModelId,
      imageUrl,
      source,
      suggestedCategory: category,
      suggestedPriority: priority,
    };
  } catch (err: any) {
    return {
      source,
      error: `Scraping error: ${err.message}. You can manually edit the details below.`,
    };
  }
}
