import { auth } from "@/auth";
import { db } from "@/db";
import { items, wishlists, financialProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculateSmartBudgetSuggestion } from "@/lib/smart-budget";
import { getUpcomingSaleEvents } from "@/lib/sale-calendar";
import { formatPHP } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/gamification/progress-ring";
import Link from "next/link";
import {
  Sparkles,
  TrendingDown,
  ShieldCheck,
  Calendar,
  Wallet,
  ArrowRight,
  PlusCircle,
  Clock,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // Retrieve user financial profile
  let profile = userId
    ? await db.query.financialProfiles.findFirst({
        where: eq(financialProfiles.userId, userId),
      })
    : null;

  // Retrieve all items for this user
  const userItems = userId
    ? await db.query.items.findMany({
        where: eq(items.userId, userId),
      })
    : [];

  // Calculate dynamic smart budget suggestion
  const budgetAnalysis = calculateSmartBudgetSuggestion({
    avgMonthlyIncome: profile?.avgMonthlyIncome || 0,
    monthlyBills: profile?.monthlyBills || 0,
    savingsRatePercent: profile?.savingsRatePercent || 20,
    items: userItems,
  });

  const nextSale = getUpcomingSaleEvents()[0];

  // Calculate Gamified Wishlist Health Score (0 - 100)
  let healthScore = 75; // baseline
  if (budgetAnalysis.avgMonthlyIncome > 0) {
    if (budgetAnalysis.discretionarySurplus > 0) healthScore += 10;
    if (budgetAnalysis.totalActiveWishlistValue <= budgetAnalysis.suggestedWishlistBudget * 3) {
      healthScore += 15; // Sustainable wishlist queue
    }
  } else {
    healthScore = 50; // Needs profile setup
  }
  healthScore = Math.min(100, healthScore);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-background p-6 rounded-3xl border border-primary/20">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-background text-primary border-primary/30">
              🇵🇭 Shopee Smart Tracker
            </Badge>
            <Badge variant="want">✨ Gamified Budgeting</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-2">
            Kamusta, {session?.user?.name?.split(" ")[0] || "Shopper"}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            {budgetAnalysis.adviceMessage}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/wishlists">
            <Button className="rounded-2xl gap-2 font-bold shadow-md shadow-primary/20">
              <PlusCircle className="h-4 w-4" /> Add Item
            </Button>
          </Link>
          <Link href="/budget">
            <Button variant="outline" className="rounded-2xl gap-2 font-bold">
              <Wallet className="h-4 w-4 text-emerald-500" /> Adjust Income
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid: Health Score & Dynamic Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Score Card */}
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <CardTitle className="text-base font-bold text-muted-foreground mb-4">
            Wishlist Health Score
          </CardTitle>
          <ProgressRing
            progress={healthScore}
            size={130}
            strokeWidth={12}
            colorClass={
              healthScore >= 80
                ? "stroke-emerald-500"
                : healthScore >= 60
                ? "stroke-blue-500"
                : "stroke-orange-500"
            }
            label={`${healthScore}`}
            sublabel="/ 100"
          />
          <Badge
            variant={healthScore >= 80 ? "success" : "secondary"}
            className="mt-4"
          >
            {healthScore >= 80 ? "🛡️ Disciplined Saver" : "✨ Getting Started"}
          </Badge>
        </Card>

        {/* Dynamic Suggested Budget */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Suggested Monthly Wishlist
              </span>
              <Badge variant="want">Smart Suggestion</Badge>
            </div>
            <div className="text-3xl font-black mt-2 text-primary">
              {formatPHP(budgetAnalysis.suggestedWishlistBudget)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Derived from {formatPHP(budgetAnalysis.avgMonthlyIncome)} income minus bills & 20% safe savings.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Active Wishlist Total:</span>
            <span className="font-bold text-foreground">
              {formatPHP(budgetAnalysis.totalActiveWishlistValue)} ({budgetAnalysis.activeItemsCount} items)
            </span>
          </div>
        </Card>

        {/* Next Philippine Sale Countdown */}
        <Card className="p-6 flex flex-col justify-between bg-gradient-to-br from-orange-500/10 to-background border-orange-500/20">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> Upcoming PH Sale
              </span>
              <Badge className="bg-orange-500 text-white font-black">
                {nextSale?.daysRemaining === 0 ? "LIVE TODAY! 🔥" : `${nextSale?.daysRemaining}d Left`}
              </Badge>
            </div>
            <div className="text-xl font-black mt-3">
              {nextSale?.event.name}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {nextSale?.event.discountAdvice}
            </p>
          </div>

          <Link href="/sales" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:underline">
            View Sale Strategy Guide <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>
      </div>

      {/* Priority Breakdown & Active Items Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority 1-4 Tiers */}
        <Card className="lg:col-span-1 p-6">
          <CardTitle className="text-base font-bold mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Priority Tiers
          </CardTitle>
          <div className="space-y-3">
            {budgetAnalysis.priorityBreakdown.map((tier) => (
              <div
                key={tier.priority}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border text-xs"
              >
                <div>
                  <div className="font-bold">{tier.title}</div>
                  <div className="text-muted-foreground">{tier.count} items</div>
                </div>
                <div className="font-black text-right">
                  {formatPHP(tier.totalAmount)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Wishlist Items Preview */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" /> Priority Items Queue
            </CardTitle>
            <Link href="/wishlists" className="text-xs font-bold text-primary hover:underline">
              View All ({userItems.length})
            </Link>
          </div>

          {userItems.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-2xl">
              <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-muted-foreground">
                No items in your wishlist yet!
              </p>
              <Link href="/wishlists">
                <Button variant="outline" size="sm" className="mt-3 rounded-xl">
                  Add Your First Want or Need
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {userItems.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={item.isNeed ? "need" : "want"}>
                      {item.isNeed ? "🛡️ Need" : "✨ Want"}
                    </Badge>
                    <div>
                      <div className="font-bold">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.category} • Priority {item.priority}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-primary">
                      {formatPHP(item.currentPrice)}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Status: {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
