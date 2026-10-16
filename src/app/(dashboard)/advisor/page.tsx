import { auth } from "@/auth";
import { db } from "@/db";
import { items, financialProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { evaluatePurchaseAdvisor } from "@/lib/advisor-engine";
import { formatPHP } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react";

export default async function AdvisorPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const profile = await db.query.financialProfiles.findFirst({
    where: eq(financialProfiles.userId, userId),
  });

  const userItems = await db.query.items.findMany({
    where: eq(items.userId, userId),
  });

  const activeItems = userItems.filter((i) => i.status !== "Purchased");

  // Discretionary wishlist budget available
  const monthlyBudget =
    profile?.customWishlistBudget ||
    Math.max(0, (profile?.avgMonthlyIncome || 0) - (profile?.monthlyBills || 0)) * 0.5 ||
    3000;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-blue-500" /> Delay Impact & Opportunity Cost Advisor
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          &quot;What Should I Buy?&quot; — See real-time mathematical consequences before buying any item.
        </p>
      </div>

      <div className="space-y-4">
        {activeItems.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h3 className="font-bold text-base">No active wishlist items to analyze</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add items in your Wishlists tab to inspect their purchase advice and delay impact.
            </p>
          </Card>
        ) : (
          activeItems.map((item) => {
            const otherItems = activeItems.filter((o) => o.id !== item.id);
            const advice = evaluatePurchaseAdvisor(
              item.currentPrice,
              monthlyBudget,
              item.currentPrice,
              item.targetPrice,
              item.isNeed,
              otherItems
            );

            return (
              <Card key={item.id} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.isNeed ? "need" : "want"}>
                        {item.isNeed ? "🛡️ Essential Need" : "✨ Want"}
                      </Badge>
                      <h3 className="font-bold text-lg">{item.name}</h3>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Priority {item.priority} • {item.category}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-primary">
                      {formatPHP(item.currentPrice)}
                    </span>
                    <Badge
                      className={
                        advice.verdict === "Buy Now"
                          ? "bg-emerald-500 text-white font-bold"
                          : advice.verdict === "Wait For Sale"
                          ? "bg-blue-500 text-white font-bold"
                          : "bg-orange-500 text-white font-bold"
                      }
                    >
                      {advice.verdict}
                    </Badge>
                  </div>
                </div>

                <div className="text-sm bg-muted/30 p-3 rounded-xl border flex items-start gap-2.5">
                  <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Advisor Analysis:</span>
                    <p className="text-muted-foreground mt-0.5">{advice.reasoning}</p>
                  </div>
                </div>

                {advice.delayedItems.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      ⚠️ Opportunity Cost: Buying this now delays these items:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {advice.delayedItems.map((del) => (
                        <div
                          key={del.id}
                          className="p-2.5 rounded-xl border bg-background text-xs flex justify-between items-center"
                        >
                          <span className="font-medium truncate mr-2">{del.name}</span>
                          <Badge variant="destructive" className="shrink-0 text-[10px]">
                            +{del.delayedByMonths} mo delay
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
