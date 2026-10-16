import { auth } from "@/auth";
import { db } from "@/db";
import { items, wishlists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { revalidatePath } from "next/cache";
import { SmartItemForm } from "@/components/items/smart-item-form";
import { CompactItemCard } from "@/components/items/compact-item-card";
import { Sparkles } from "lucide-react";

export default async function WishlistsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  // Retrieve or create default wishlist
  let userWishlists = await db.query.wishlists.findMany({
    where: eq(wishlists.userId, userId),
  });

  if (userWishlists.length === 0) {
    const defaultWishlist = await db
      .insert(wishlists)
      .values({
        userId,
        name: "General Wants",
        isDefault: true,
      })
      .returning();
    userWishlists = defaultWishlist;
  }

  const allUserItems = await db.query.items.findMany({
    where: eq(items.userId, userId),
  });

  // Items shown in the main list: standalone items or primary items (parentItemId is null)
  const primaryItems = allUserItems.filter((i) => !i.parentItemId);

  async function markPurchased(itemId: string) {
    "use server";
    await db
      .update(items)
      .set({
        status: "Purchased",
        purchasedAt: new Date().toISOString(),
      })
      .where(eq(items.id, itemId));

    revalidatePath("/wishlists");
    revalidatePath("/");
  }

  async function deleteItem(itemId: string) {
    "use server";
    await db.delete(items).where(eq(items.id, itemId));
    revalidatePath("/wishlists");
    revalidatePath("/");
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-purple-500" /> Wishlist & Item Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Categorize items by Priority 1–4, tag as 🛡️ Essential Need or ✨ Want, and track prices with smart targets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Smart Item Form (Shopee/Lazada link auto-fetch + manual direct input + auto tags + default Want) */}
        <div className="lg:col-span-1">
          <SmartItemForm wishlistId={userWishlists[0]?.id || ""} />
        </div>

        {/* Wishlist Items List - Compact Mode */}
        <div className="lg:col-span-2 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Tracked Items ({primaryItems.length})
            </span>
            <span className="text-xs text-muted-foreground">
              Click any item or &quot;Details&quot; to inspect &amp; edit
            </span>
          </div>

          {primaryItems.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <h3 className="font-bold text-base">No items found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Fill out the form on the left to start tracking your purchases.
              </p>
            </Card>
          ) : (
            primaryItems.map((item) => {
              // Attached alternatives: items where parentItemId === item.id
              const attachedAlternatives = allUserItems.filter((i) => i.parentItemId === item.id);
              // Available items to pick: other primary items not currently attached
              const availableItemsToPick = primaryItems.filter((i) => i.id !== item.id);

              return (
                <CompactItemCard
                  key={item.id}
                  item={item}
                  availableItemsToPick={availableItemsToPick}
                  attachedAlternatives={attachedAlternatives}
                  onMarkPurchased={markPurchased}
                  onDeleteItem={deleteItem}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
