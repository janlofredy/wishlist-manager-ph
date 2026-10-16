import { auth } from "@/auth";
import { db } from "@/db";
import { financialProfiles, items, wishlists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculateSmartBudgetSuggestion } from "@/lib/smart-budget";
import { formatPHP } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { revalidatePath } from "next/cache";
import { Wallet, ShieldCheck, Sparkles, TrendingUp, CheckCircle, Sliders } from "lucide-react";

export default async function BudgetPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const profile = await db.query.financialProfiles.findFirst({
    where: eq(financialProfiles.userId, userId),
  });

  const userItems = await db.query.items.findMany({
    where: eq(items.userId, userId),
  });

  const analysis = calculateSmartBudgetSuggestion({
    avgMonthlyIncome: profile?.avgMonthlyIncome || 0,
    monthlyBills: profile?.monthlyBills || 0,
    savingsRatePercent: profile?.savingsRatePercent || 20,
    items: userItems,
  });

  // Effective budget: manual custom override takes priority if set, else smart suggested
  const activeWishlistBudget =
    profile?.customWishlistBudget && profile.customWishlistBudget > 0
      ? profile.customWishlistBudget
      : analysis.suggestedWishlistBudget;

  async function updateFinancialProfile(formData: FormData) {
    "use server";
    const income = parseFloat(formData.get("income") as string) || 0;
    const bills = parseFloat(formData.get("bills") as string) || 0;
    const savingsPercent = parseFloat(formData.get("savingsPercent") as string) || 20;
    const customBudgetRaw = formData.get("customWishlistBudget") as string;
    const customWishlistBudget = customBudgetRaw ? parseFloat(customBudgetRaw) : null;

    const existing = await db.query.financialProfiles.findFirst({
      where: eq(financialProfiles.userId, userId!),
    });

    if (existing) {
      await db
        .update(financialProfiles)
        .set({
          avgMonthlyIncome: income,
          monthlyBills: bills,
          savingsRatePercent: savingsPercent,
          customWishlistBudget: customWishlistBudget !== null && !isNaN(customWishlistBudget) ? customWishlistBudget : null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(financialProfiles.userId, userId!));
    } else {
      await db.insert(financialProfiles).values({
        userId: userId!,
        avgMonthlyIncome: income,
        monthlyBills: bills,
        savingsRatePercent: savingsPercent,
        customWishlistBudget: customWishlistBudget !== null && !isNaN(customWishlistBudget) ? customWishlistBudget : null,
      });
    }

    revalidatePath("/budget");
    revalidatePath("/wishlists");
    revalidatePath("/");
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <Wallet className="h-7 w-7 text-emerald-500" /> Dynamic Smart Budget Planner
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set your income, expenses, and choose between an automated smart suggestion or your own custom manual wishlist allowance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income, Bills & Manual Override Configuration Card */}
        <Card className="md:col-span-1 p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg font-bold">Monthly Budget Settings</CardTitle>
            <CardDescription className="text-xs">
              Configure your cashflow or set a fixed monthly allowance.
            </CardDescription>
          </CardHeader>

          <form action={updateFinancialProfile} className="space-y-4 text-sm">
            {/* Manual Budget Override */}
            <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-primary flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5" /> Manual Wishlist Budget (₱)
                </label>
                {profile?.customWishlistBudget && profile.customWishlistBudget > 0 ? (
                  <Badge variant="outline" className="text-[9px] bg-background text-primary">
                    Manual Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[9px]">
                    Auto AI
                  </Badge>
                )}
              </div>
              <Input
                name="customWishlistBudget"
                type="number"
                step="100"
                placeholder="e.g. 5000 (or leave blank for auto)"
                defaultValue={profile?.customWishlistBudget || ""}
                className="bg-background rounded-xl font-bold"
              />
              <span className="text-[10px] text-muted-foreground block leading-tight">
                Leave blank to automatically compute from your income &amp; savings formula.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Average Monthly Income (PHP ₱)
              </label>
              <Input
                name="income"
                type="number"
                step="500"
                placeholder="e.g. 25000"
                defaultValue={profile?.avgMonthlyIncome || ""}
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Committed Bills & Essentials (PHP ₱)
              </label>
              <Input
                name="bills"
                type="number"
                step="500"
                placeholder="Rent, utilities, groceries..."
                defaultValue={profile?.monthlyBills || ""}
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Emergency Savings Lock (%)
              </label>
              <Input
                name="savingsPercent"
                type="number"
                step="1"
                min="10"
                max="50"
                placeholder="20"
                defaultValue={profile?.savingsRatePercent || 20}
                className="rounded-xl"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Standard Philippine safety rule is min 20%.
              </span>
            </div>

            <Button type="submit" className="w-full font-bold rounded-xl mt-2">
              Save Budget Settings
            </Button>
          </form>
        </Card>

        {/* Dynamic Breakdown & Active Allocation Engine Card */}
        <Card className="md:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" /> Active Wishlist Allocation
              </CardTitle>
              <Badge variant={profile?.customWishlistBudget ? "default" : "want"}>
                {profile?.customWishlistBudget ? "Manual Fixed Budget" : "Smart Recommendation"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-muted/40 border">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">
                  Committed Bills
                </div>
                <div className="text-lg font-black mt-1">
                  {formatPHP(analysis.monthlyBills)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
                  🛡️ Savings Fortress
                </div>
                <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">
                  {formatPHP(analysis.recommendedSavings)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 col-span-2 sm:col-span-1">
                <div className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">
                  ✨ Discretionary Surplus
                </div>
                <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-1">
                  {formatPHP(analysis.discretionarySurplus)}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/15 via-purple-500/10 to-transparent border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-primary">
                  {profile?.customWishlistBudget
                    ? "Your Manual Monthly Wishlist Budget"
                    : "Suggested Monthly Wishlist Pool"}
                </div>
                {profile?.customWishlistBudget ? (
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    (Auto was {formatPHP(analysis.suggestedWishlistBudget)})
                  </span>
                ) : null}
              </div>

              <div className="text-3xl md:text-4xl font-black text-primary mt-1.5">
                {formatPHP(activeWishlistBudget)}{" "}
                <span className="text-xs font-normal text-muted-foreground">/ month</span>
              </div>

              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {profile?.customWishlistBudget
                  ? `You have manually locked your monthly shopping pool to ${formatPHP(
                      profile.customWishlistBudget
                    )}. Clear the manual field to switch back to the AI cashflow suggestion.`
                  : analysis.adviceMessage}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-2">
            <span>
              Target Timeline: Clear Priority 1 in ~
              {activeWishlistBudget > 0
                ? Math.ceil(
                    userItems
                      .filter((i) => !i.parentItemId && i.status !== "Purchased" && i.priority === 1)
                      .reduce((sum, i) => sum + i.currentPrice, 0) / activeWishlistBudget
                  ) || 1
                : "∞"}{" "}
              month(s).
            </span>
            <span>
              All active items (
              {userItems.filter((i) => !i.parentItemId && i.status !== "Purchased").length}
              ): ~
              {activeWishlistBudget > 0
                ? Math.ceil(
                    userItems
                      .filter((i) => !i.parentItemId && i.status !== "Purchased")
                      .reduce((sum, i) => sum + i.currentPrice, 0) / activeWishlistBudget
                  ) || 1
                : "∞"}{" "}
              month(s).
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
