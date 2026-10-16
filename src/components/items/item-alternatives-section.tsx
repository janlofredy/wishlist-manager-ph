"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPHP } from "@/lib/utils";
import { Split, Plus, ExternalLink, Undo2, ArrowRightLeft, Sparkles } from "lucide-react";

export interface WishlistItemSimple {
  id: string;
  name: string;
  currentPrice: number;
  shopeeUrl?: string | null;
  category: string;
  isNeed: boolean;
  parentItemId?: string | null;
}

interface ItemAlternativesSectionProps {
  primaryItem: WishlistItemSimple;
  availableItemsToPick: WishlistItemSimple[]; // Other normal items from the wishlist
  attachedAlternatives: WishlistItemSimple[]; // Items currently attached as alternatives to this item
}

export function ItemAlternativesSection({
  primaryItem,
  availableItemsToPick = [],
  attachedAlternatives = [],
}: ItemAlternativesSectionProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLinkAlternative(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChildId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/items/alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentItemId: primaryItem.id,
          childItemId: selectedChildId,
        }),
      });

      if (!res.ok) throw new Error("Failed to link item");
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDetachAlternative(childItemId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/items/alternatives?childItemId=${childItemId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to detach item");
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const totalOptionsCount = attachedAlternatives.length + 1;

  return (
    <div className="mt-3 pt-3 border-t text-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold flex items-center gap-1.5 text-muted-foreground">
          <Split className="h-3.5 w-3.5 text-purple-500" /> &quot;Either / Or&quot; Alternatives ({totalOptionsCount} choices)
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

      {/* Either / Or Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {/* Option A: Primary Item */}
        <div className="p-2.5 rounded-xl border bg-primary/5 border-primary/20 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1">
            <div>
              <Badge variant="outline" className="text-[9px] bg-background">Option A (Primary)</Badge>
              <div className="font-bold text-foreground mt-1 truncate">{primaryItem.name}</div>
            </div>
            <span className="font-black text-primary">{formatPHP(primaryItem.currentPrice)}</span>
          </div>
          {primaryItem.shopeeUrl && (
            <a
              href={primaryItem.shopeeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-orange-500 hover:underline flex items-center gap-1 mt-1.5"
            >
              Listing Link <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>

        {/* Attached Alternatives Picked From Wishlist */}
        {attachedAlternatives.map((alt, idx) => (
          <div key={alt.id} className="p-2.5 rounded-xl border bg-purple-500/5 border-purple-500/20 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1">
              <div>
                <div className="flex items-center gap-1">
                  <Badge variant="want" className="text-[9px]">Option {String.fromCharCode(66 + idx)}</Badge>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                    {alt.category}
                  </span>
                </div>
                <div className="font-bold text-foreground mt-1 truncate">{alt.name}</div>
              </div>
              <div className="text-right">
                <span className="font-black text-purple-600 dark:text-purple-400 block">
                  {formatPHP(alt.currentPrice)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDetachAlternative(alt.id)}
                  disabled={loading}
                  className="text-xs text-muted-foreground hover:text-primary mt-1 inline-flex items-center gap-1 font-semibold"
                  title="Put back as normal standalone wishlist item"
                >
                  <Undo2 className="h-3 w-3" /> Put back
                </button>
              </div>
            </div>
            {alt.shopeeUrl && (
              <a
                href={alt.shopeeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-orange-500 hover:underline flex items-center gap-1 mt-1.5"
              >
                Listing Link <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Choose from Wishlist Picker */}
      {showPicker && (
        <form onSubmit={handleLinkAlternative} className="mt-2.5 p-3 rounded-xl border bg-card space-y-2">
          <div className="font-bold text-muted-foreground text-[11px] flex items-center gap-1.5">
            <ArrowRightLeft className="h-3.5 w-3.5 text-primary" /> Choose an item from your wishlist to pair as an alternative:
          </div>

          {availableItemsToPick.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">
              No other standalone items available to pair. Add another item to your wishlist first!
            </p>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="h-9 flex-1 rounded-xl border border-input bg-background px-3 text-xs"
                required
              >
                <option value="">-- Select an item to pair (e.g. iPad Mini) --</option>
                {availableItemsToPick.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({formatPHP(item.currentPrice)})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setShowPicker(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs font-bold gap-1"
                  disabled={loading || !selectedChildId}
                >
                  Pair as Alternative
                </Button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
