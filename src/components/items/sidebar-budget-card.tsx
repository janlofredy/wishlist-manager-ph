"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPHP } from "@/lib/utils";
import { Wallet, Save, Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface SidebarBudgetCardProps {
  currentMonthlyBudget: number;
  isManual: boolean;
  totalActiveWishlistValue: number;
}

export function SidebarBudgetCard({
  currentMonthlyBudget,
  isManual,
  totalActiveWishlistValue,
}: SidebarBudgetCardProps) {
  const router = useRouter();
  const [budgetVal, setBudgetVal] = useState<string>(
    currentMonthlyBudget > 0 ? currentMonthlyBudget.toString() : ""
  );
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const parsed = budgetVal ? parseFloat(budgetVal) : null;
      const res = await fetch("/api/budget/quick-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customWishlistBudget: parsed }),
      });

      if (!res.ok) throw new Error("Failed to update budget");

      setIsEditing(false);
      setSavedSuccess(true);
      router.refresh();
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const percentUsed =
    currentMonthlyBudget > 0
      ? Math.min(100, Math.round((totalActiveWishlistValue / currentMonthlyBudget) * 100))
      : 0;

  return (
    <Card className="p-4 border bg-gradient-to-br from-card to-primary/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
          <Wallet className="h-3.5 w-3.5 text-emerald-500" /> Wishlist Budget
        </span>
        <Badge variant={isManual ? "default" : "want"} className="text-[10px]">
          {isManual ? "Manual Fixed" : "Auto AI"}
        </Badge>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-2 mt-1">
          <label className="text-[11px] font-semibold text-muted-foreground block">
            Enter Monthly Allowance (₱):
          </label>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              step="100"
              placeholder="e.g. 5000"
              value={budgetVal}
              onChange={(e) => setBudgetVal(e.target.value)}
              className="h-8 text-xs font-bold rounded-xl"
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="h-8 px-2.5 text-xs rounded-xl font-bold gap-1"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="h-8 px-2 text-xs rounded-xl"
            >
              Cancel
            </Button>
          </div>
          <span className="text-[10px] text-muted-foreground block">
            Leave blank to revert to AI income suggestion.
          </span>
        </form>
      ) : (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-primary">
              {formatPHP(currentMonthlyBudget)}
              <span className="text-xs font-normal text-muted-foreground"> /mo</span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-7 px-2 text-[11px] rounded-lg font-semibold"
            >
              Set Budget
            </Button>
          </div>

          {savedSuccess && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <Check className="h-3 w-3" /> Budget updated!
            </span>
          )}

          {/* Mini progress bar of active wishlist total vs monthly budget */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>Active queue: {formatPHP(totalActiveWishlistValue)}</span>
              <span>{percentUsed}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percentUsed > 100
                    ? "bg-orange-500"
                    : "bg-primary"
                }`}
                style={{ width: `${Math.min(100, percentUsed)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
