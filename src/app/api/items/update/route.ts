import { auth } from "@/auth";
import { db } from "@/db";
import { items } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      name,
      category,
      priority,
      isNeed,
      currentPrice,
      targetPrice,
      notes,
      shopeeUrl,
      status,
    } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify ownership and update
    const [updated] = await db
      .update(items)
      .set({
        name: name.trim(),
        category: category || "General",
        priority: Number(priority) || 2,
        isNeed: Boolean(isNeed),
        currentPrice: Number(currentPrice) || 0,
        estimatedPrice: Number(currentPrice) || 0,
        targetPrice: targetPrice !== "" && targetPrice !== null && targetPrice !== undefined ? Number(targetPrice) : null,
        notes: notes ? notes.trim() : null,
        shopeeUrl: shopeeUrl ? shopeeUrl.trim() : null,
        status: status || "Waiting",
        purchasedAt: status === "Purchased" ? new Date().toISOString() : null,
      })
      .where(and(eq(items.id, id), eq(items.userId, userId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("Failed to update item:", error);
    return NextResponse.json({ error: error.message || "Failed to update item" }, { status: 500 });
  }
}
