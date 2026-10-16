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

  const formData = await req.formData();
  const name = formData.get("name") as string;
  const estimatedPrice = parseFloat(formData.get("price") as string) || 0;
  const targetPrice = parseFloat(formData.get("targetPrice") as string) || null;
  const priority = parseInt(formData.get("priority") as string) || 2;
  const isNeed = formData.get("isNeed") === "on" || formData.get("isNeed") === "true";
  const shopeeUrl = (formData.get("shopeeUrl") as string) || null;
  const category = (formData.get("category") as string) || "General";
  let wishlistId = formData.get("wishlistId") as string;

  if (!wishlistId) {
    const defaultList = await db.query.wishlists.findFirst({
      where: eq(wishlists.userId, userId),
    });
    wishlistId = defaultList?.id || "";
  }

  const variation = (formData.get("variation") as string) || null;

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

  return NextResponse.redirect(new URL("/wishlists", req.url));
}
