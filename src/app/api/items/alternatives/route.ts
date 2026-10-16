import { auth } from "@/auth";
import { db } from "@/db";
import { itemAlternatives, items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { itemId, title, price, shopeeUrl, notes } = body;

  if (!itemId || !title || typeof price !== "number") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const created = await db
    .insert(itemAlternatives)
    .values({
      itemId,
      title,
      price,
      shopeeUrl,
      notes,
    })
    .returning();

  return NextResponse.json(created[0]);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Alternative ID required" }, { status: 400 });
  }

  await db.delete(itemAlternatives).where(eq(itemAlternatives.id, id));
  return NextResponse.json({ success: true });
}
