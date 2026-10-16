import { auth } from "@/auth";
import { db } from "@/db";
import { items } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// POST /api/items/alternatives
// Body: { parentItemId: string, childItemId: string }
// Links an existing wishlist item as an alternative under parentItemId
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { parentItemId, childItemId } = body;

  if (!parentItemId || !childItemId) {
    return NextResponse.json({ error: "parentItemId and childItemId required" }, { status: 400 });
  }

  // Ensure both items belong to this user
  await db
    .update(items)
    .set({ parentItemId })
    .where(and(eq(items.id, childItemId), eq(items.userId, userId)));

  return NextResponse.json({ success: true });
}

// DELETE /api/items/alternatives?childItemId=...
// Detaches an alternative item back to being an independent normal wishlist item
export async function DELETE(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const childItemId = searchParams.get("childItemId");

  if (!childItemId) {
    return NextResponse.json({ error: "childItemId required" }, { status: 400 });
  }

  // Set parentItemId back to null so it returns as a normal item in the main wishlist
  await db
    .update(items)
    .set({ parentItemId: null })
    .where(and(eq(items.id, childItemId), eq(items.userId, userId)));

  return NextResponse.json({ success: true });
}
