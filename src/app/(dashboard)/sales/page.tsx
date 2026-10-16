import { getUpcomingSaleEvents } from "@/lib/sale-calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Tag, Sparkles, CheckCircle2 } from "lucide-react";

export default function SalesPage() {
  const sales = getUpcomingSaleEvents();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <Calendar className="h-7 w-7 text-orange-500" /> Philippine Sale Event Calendar
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Shopee & Lazada Philippine double-day and payday campaign schedule with discount strategies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sales.map((item) => (
          <Card
            key={item.event.id}
            className={`p-6 space-y-4 border transition-all ${
              item.isLive
                ? "border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10"
                : "border-border"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <Badge
                  className={
                    item.isLive
                      ? "bg-orange-500 text-white font-bold animate-pulse"
                      : "bg-muted text-muted-foreground font-bold"
                  }
                >
                  {item.isLive ? "LIVE NOW 🔥" : `${item.daysRemaining} Days Away`}
                </Badge>
                <h3 className="font-bold text-lg mt-2">{item.event.name}</h3>
                <span className="text-xs text-muted-foreground">
                  Starts: {item.event.startDate} • Type: {item.event.type}
                </span>
              </div>
            </div>

            <div className="text-xs bg-card p-3 rounded-xl border space-y-1">
              <span className="font-bold text-orange-600 dark:text-orange-400 block">
                💡 Buying Strategy:
              </span>
              <p className="text-muted-foreground">{item.event.discountAdvice}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                Recommended Vouchers to Claim:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {item.event.voucherTips.map((tip, idx) => (
                  <Badge key={idx} variant="outline" className="text-[10px] gap-1">
                    <Tag className="h-3 w-3 text-orange-500" /> {tip}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
