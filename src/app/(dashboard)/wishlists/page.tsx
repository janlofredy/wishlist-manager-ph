import { auth } from "@/auth";
import { db } from "@/db";
import { items, wishlists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatPHP } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  ExternalLink,
  ShieldCheck,
  Trash2,
  CheckCircle,
  Tag,
} from "lucide-react";

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

  const userItems = await db.query.items.findMany({
    where: eq(items.userId, userId),
  });

  async function addItem(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const estimatedPrice = parseFloat(formData.get("price") as string) || 0;
    const targetPrice = parseFloat(formData.get("targetPrice") as string) || null;
    const priority = parseInt(formData.get("priority") as string) || 2;
    const isNeed = formData.get("isNeed") === "on";
    const shopeeUrl = (formData.get("shopeeUrl") as string) || null;
    const category = (formData.get("category") as string) || "General";
    const wishlistId = (formData.get("wishlistId") as string) || userWishlists[0].id;

    await db.insert(items).values({
      wishlistId,
      userId: userId!,
      name,
      category,
      priority,
      isNeed,
      estimatedPrice,
      currentPrice: estimatedPrice,
      targetPrice,
      shopeeUrl,
      status: "Waiting",
    });

    revalidatePath("/wishlists");
    revalidatePath("/");
  }

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
            Categorize items by Priority 1–4, tag as 🛡️ Essential Need or ✨ Want, and track Shopee Philippines prices.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Item Quick Form */}
        <Card className="lg:col-span-1 p-6 h-fit">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Add Wishlist Item
            </CardTitle>
          </CardHeader>

          <form action={addItem} className="space-y-3 text-sm">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Item Name
              </label>
              <Input name="name" placeholder="e.g. Oral-B Vitality Toothbrush" required />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Estimated Price (₱)
                </label>
                <Input name="price" type="number" step="10" placeholder="1000" required />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Target Price (₱)
                </label>
                <Input name="targetPrice" type="number" step="10" placeholder="800" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Priority Tier
                </label>
                <select
                  name="priority"
                  className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs"
                  defaultValue="2"
                >
                  <option value="1">1: Quick Win (&lt; ₱1.5k)</option>
                  <option value="2">2: Utility & Hobby</option>
                  <option value="3">3: Mid-Cost Want</option>
                  <option value="4">4: Large Purchase</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Category
                </label>
                <Input name="category" placeholder="Electronics, Tools..." defaultValue="General" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Shopee Philippines URL (Optional)
              </label>
              <Input name="shopeeUrl" placeholder="https://shopee.ph/product/..." />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isNeed"
                name="isNeed"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isNeed" className="text-xs font-bold text-foreground cursor-pointer">
                🛡️ Mark as Essential Need (Not a pure want)
              </label>
            </div>

            <Button type="submit" className="w-full font-bold rounded-xl mt-3">
              Save To Wishlist
            </Button>
          </form>
        </Card>

        {/* Wishlist Items List */}
        <div className="lg:col-span-2 space-y-3">
          {userItems.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <h3 className="font-bold text-base">No items found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Fill out the form on the left to start tracking your purchases.
              </p>
            </Card>
          ) : (
            userItems.map((item) => (
              <Card key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={item.isNeed ? "need" : "want"}>
                      {item.isNeed ? "🛡️ Need" : "✨ Want"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      P{item.priority}:{" "}
                      {item.priority === 1
                        ? "Quick Win"
                        : item.priority === 2
                        ? "Hobby & Utility"
                        : item.priority === 3
                        ? "Mid-Cost"
                        : "Large"}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {item.category}
                    </Badge>
                    <Badge
                      className={
                        item.status === "Purchased"
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-base mt-1">{item.name}</h3>

                  {item.shopeeUrl && (
                    <a
                      href={item.shopeeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-orange-500 hover:underline"
                    >
                      Shopee Listing <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-black text-primary">
                      {formatPHP(item.currentPrice)}
                    </div>
                    {item.targetPrice && (
                      <span className="text-[10px] text-muted-foreground block">
                        Target: {formatPHP(item.targetPrice)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.status !== "Purchased" && (
                      <form action={markPurchased.bind(null, item.id)}>
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="rounded-lg h-9 text-xs text-emerald-600 dark:text-emerald-400 gap-1"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Bought
                        </Button>
                      </form>
                    )}

                    <form action={deleteItem.bind(null, item.id)}>
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
