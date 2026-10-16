"use client";

import { useState } from "react";
import { formatPHP } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Plus,
  ArrowRightLeft,
  Loader2,
  Undo2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ItemAlternativesSectionProps {
  primaryItem: any;
  availableItemsToPick: any[];
  attachedAlternatives: any[];
}

export function ItemAlternativesSection({
  primaryItem,
  availableItemsToPick,
  attachedAlternatives,
}: ItemAlternativesSectionProps) {
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLinkAlternative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/items/alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "attach",
          parentItemId: primaryItem.id,
          childItemId: selectedItemId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to pair item");

      setSelectedItemId("");
      setShowPicker(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDetachAlternative = async (childItemId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/items/alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "detach",
          childItemId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to detach item");

      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Header / Trigger */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
          <ArrowRightLeft className="h-3.5 w-3.5" />
          &ldquo;Either / Or&rdquo; Alternatives ({attachedAlternatives.length + 1} choices)
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[11px] text-primary gap-1"
          onClick={() => setShowPicker(!showPicker)}
        >
          <Plus className="h-3 w-3" /> Pair Wishlist Item
        </Button>
      </div>

      {/* Either / Or Comparison Grid - only rendered when there are attached alternatives */}
      {attachedAlternatives.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {/* Option A: Primary Item */}
          <div className="p-3 rounded-xl border bg-primary/5 border-primary/20 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <Badge variant="outline" className="text-[10px] bg-background shrink-0">
                  Option A (Primary)
                </Badge>
                <span className="font-black text-sm text-primary shrink-0">
                  {formatPHP(primaryItem.currentPrice)}
                </span>
              </div>
              <div className="font-bold text-xs text-foreground line-clamp-2 break-words" title={primaryItem.name}>
                {primaryItem.name}
              </div>
            </div>
            {primaryItem.shopeeUrl && (
              <div className="pt-2 mt-1 border-t border-border/40">
                <a
                  href={primaryItem.shopeeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-orange-500 hover:underline inline-flex items-center gap-1 font-medium"
                >
                  Listing Link <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            )}
          </div>

          {/* Attached Alternatives Picked From Wishlist */}
          {attachedAlternatives.map((alt, idx) => (
            <div
              key={alt.id}
              className="p-3 rounded-xl border bg-purple-500/5 border-purple-500/20 flex flex-col justify-between min-w-0"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Badge variant="want" className="text-[10px] shrink-0">
                      Option {String.fromCharCode(66 + idx)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {alt.category}
                    </span>
                  </div>
                  <span className="font-black text-sm text-purple-600 dark:text-purple-400 shrink-0">
                    {formatPHP(alt.currentPrice)}
                  </span>
                </div>
                <div className="font-bold text-xs text-foreground line-clamp-2 break-words" title={alt.name}>
                  {alt.name}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/40 text-[10px]">
                {alt.shopeeUrl ? (
                  <a
                    href={alt.shopeeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:underline inline-flex items-center gap-1 font-medium truncate max-w-[120px]"
                  >
                    Listing Link <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                  </a>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => handleDetachAlternative(alt.id)}
                  disabled={loading}
                  className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 font-semibold transition-colors shrink-0 ml-auto"
                  title="Put back as normal standalone wishlist item"
                >
                  <Undo2 className="h-3 w-3" /> Put back
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Choose from Wishlist Picker */}
      {showPicker && (
        <form onSubmit={handleLinkAlternative} className="mt-2.5 p-3 rounded-xl border bg-card space-y-2">
          <div className="font-bold text-muted-foreground text-[11px] flex items-center gap-1.5">
            <ArrowRightLeft className="h-3.5 w-3.5 text-primary" /> Choose an item from your wishlist to pair as an alternative:
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="flex-1 h-9 px-3 text-xs rounded-xl border bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
            >
              <option value="">-- Select an item to pair --</option>
              {availableItemsToPick.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({formatPHP(item.currentPrice)})
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="submit"
                size="sm"
                disabled={loading || !selectedItemId}
                className="h-9 px-3 text-xs rounded-xl gap-1"
              >
                {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                Pair
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPicker(false)}
                className="h-9 px-2 text-xs rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>

          {availableItemsToPick.length === 0 && (
            <p className="text-[11px] text-muted-foreground italic">
              No other items available in your wishlist to pair. Add more items first!
            </p>
          )}

          {error && <div className="text-[11px] text-destructive">{error}</div>}
        </form>
      )}
    </div>
  );
}
