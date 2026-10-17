import { auth } from "@/auth";
import { db } from "@/db";
import { financialProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customWishlistBudget } = await req.json();

    const existing = await db.query.financialProfiles.findFirst({
      where: eq(financialProfiles.userId, userId),
    });

    if (existing) {
      await db
        .update(financialProfiles)
        .set({
          customWishlistBudget:
            customWishlistBudget !== null && !isNaN(customWishlistBudget) && customWishlistBudget > 0
              ? Number(customWishlistBudget)
              : null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(financialProfiles.userId, userId));
    } else {
      await db.insert(financialProfiles).values({
        userId,
        customWishlistBudget:
          customWishlistBudget !== null && !isNaN(customWishlistBudget) && customWishlistBudget > 0
            ? Number(customWishlistBudget)
            : null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update budget" },
      { status: 500 }
    );
  }
}
