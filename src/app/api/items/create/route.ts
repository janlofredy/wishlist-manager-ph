import { auth } from "@/auth";
import { db } from "@/db";
import { items, wishlists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  let shopeeUrl: string | null = null;
  let name: string | null = null;
  let estimatedPrice = 0;
  let targetPrice: number | null = null;
  let priority = 2;
  let isNeed = false;
  let category = "General";
  let wishlistId: string | null = null;
  let variation: string | null = null;

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const json = await req.json();
    shopeeUrl = json.shopeeUrl || null;
    name = json.name ? String(json.name).trim() : null;
    estimatedPrice = typeof json.price === "number" ? json.price : parseFloat(json.price) || 0;
    targetPrice = json.targetPrice ? (typeof json.targetPrice === "number" ? json.targetPrice : parseFloat(json.targetPrice)) : null;
    priority = typeof json.priority === "number" ? json.priority : parseInt(json.priority) || 2;
    isNeed = Boolean(json.isNeed);
    category = json.category || "General";
    wishlistId = json.wishlistId || null;
    variation = json.variation || null;
  } else {
    const formData = await req.formData();
    shopeeUrl = (formData.get("shopeeUrl") as string) || null;
    name = (formData.get("name") as string)?.trim() || null;
    estimatedPrice = parseFloat(formData.get("price") as string) || 0;
    targetPrice = parseFloat(formData.get("targetPrice") as string) || null;
    priority = parseInt(formData.get("priority") as string) || 2;
    isNeed = formData.get("isNeed") === "on" || formData.get("isNeed") === "true";
    category = (formData.get("category") as string) || "General";
    wishlistId = (formData.get("wishlistId") as string) || null;
    variation = (formData.get("variation") as string) || null;
  }

  // If user only provided a link and name is blank, extract a friendly fallback title
  if (!name && shopeeUrl) {
    try {
      const urlObj = new URL(shopeeUrl);
      const pathSegments = urlObj.pathname.split("/").filter(Boolean);
      let rawSlug = pathSegments[pathSegments.length - 1] || "";
      rawSlug = rawSlug.replace(/-i\.\d+\.\d+.*$/, "").replace(/\?.*$/, "");
      try {
        rawSlug = decodeURIComponent(rawSlug);
      } catch {}
      name = rawSlug.replace(/-/g, " ").trim() || "Shopee Item";
    } catch {
      name = "Saved Listing Item";
    }
  } else if (!name) {
    name = "Wishlist Item";
  }

  if (!wishlistId) {
    const defaultList = await db.query.wishlists.findFirst({
      where: eq(wishlists.userId, userId),
    });
    wishlistId = defaultList?.id || "";
  }

  await db.insert(items).values({
    wishlistId,
    userId,
    name,
    category,
    priority,
    isNeed,
    estimatedPrice,
    currentPrice: estimatedPrice,
    targetPrice,
    shopeeUrl,
    notes: variation ? `Option: ${variation}` : null,
    status: "Waiting",
  });

  if (contentType.includes("application/json")) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.redirect(new URL("/wishlists", req.url));
}
