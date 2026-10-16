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
import { Wallet, ShieldCheck, Sparkles, TrendingUp, HelpCircle } from "lucide-react";

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

  async function updateFinancialProfile(formData: FormData) {
    "use server";
    const income = parseFloat(formData.get("income") as string) || 0;
    const bills = parseFloat(formData.get("bills") as string) || 0;
    const savingsPercent = parseFloat(formData.get("savingsPercent") as string) || 20;

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
          updatedAt: new Date().toISOString(),
        })
        .where(eq(financialProfiles.userId, userId!));
    } else {
      await db.insert(financialProfiles).values({
        userId: userId!,
        avgMonthlyIncome: income,
        monthlyBills: bills,
        savingsRatePercent: savingsPercent,
      });
    }

    revalidatePath("/budget");
    revalidatePath("/");
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <Wallet className="h-7 w-7 text-emerald-500" /> Dynamic Smart Budget Planner
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          No static salary rules. Enter what you earn and your obligations; our engine will calculate the optimal wishlist allocation based on your items.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income & Bills Configuration Card */}
        <Card className="md:col-span-1 p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg font-bold">Your Monthly Cashflow</CardTitle>
            <CardDescription className="text-xs">
              Updated anytime your salary or side-income changes.
            </CardDescription>
          </CardHeader>

          <form action={updateFinancialProfile} className="space-y-4 text-sm">
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
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Standard Philippine safety rule is min 20%.
              </span>
            </div>

            <Button type="submit" className="w-full font-bold rounded-xl mt-2">
              Save & Recalculate
            </Button>
          </form>
        </Card>

        {/* Dynamic Breakdown & Suggestion Engine Card */}
        <Card className="md:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" /> Smart Allocation Suggestion
              </CardTitle>
              <Badge variant="want">AI Recommendation</Badge>
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

            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/15 via-purple-500/10 to-transparent border border-primary/20">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">
                Suggested Wishlist Pool
              </div>
              <div className="text-3xl font-black text-primary mt-1">
                {formatPHP(analysis.suggestedWishlistBudget)}{" "}
                <span className="text-xs font-normal text-muted-foreground">/ month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {analysis.adviceMessage}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-2">
            <span>
              Target Timeline: Clear Priority 1 in ~{analysis.projectedMonthsToClearPriority1} month(s).
            </span>
            <span>
              All active items ({analysis.activeItemsCount}): ~{analysis.projectedMonthsToClearAll} month(s).
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
