"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPHP } from "@/lib/utils";
import { Split, Plus, ExternalLink, Trash2, CheckCircle2 } from "lucide-react";

export interface AlternativeItem {
  id: string;
  itemId: string;
  title: string;
  price: number;
  shopeeUrl?: string | null;
  notes?: string | null;
  isSelected: boolean | null;
}

interface ItemAlternativesSectionProps {
  itemId: string;
  primaryTitle: string;
  primaryPrice: number;
  primaryShopeeUrl?: string | null;
  alternatives: AlternativeItem[];
}

export function ItemAlternativesSection({
  itemId,
  primaryTitle,
  primaryPrice,
  primaryShopeeUrl,
  alternatives = [],
}: ItemAlternativesSectionProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [altTitle, setAltTitle] = useState("");
  const [altPrice, setAltPrice] = useState("");
  const [altUrl, setAltUrl] = useState("");
  const [altNotes, setAltNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAddAlternative(e: React.FormEvent) {
    e.preventDefault();
    if (!altTitle || !altPrice) return;

    setSubmitting(true);
    try {
      await fetch("/api/items/alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          title: altTitle,
          price: parseFloat(altPrice),
          shopeeUrl: altUrl || null,
          notes: altNotes || null,
        }),
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAlternative(altId: string) {
    try {
      await fetch(`/api/items/alternatives?id=${altId}`, {
        method: "DELETE",
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t text-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold flex items-center gap-1.5 text-muted-foreground">
          <Split className="h-3.5 w-3.5 text-purple-500" /> &quot;Either / Or&quot; Comparison ({alternatives.length + 1} options)
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[11px] text-primary gap-1"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus className="h-3 w-3" /> Add Alternative
        </Button>
      </div>

      {/* Primary & Alternative Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {/* Primary Item Option */}
        <div className="p-2.5 rounded-xl border bg-primary/5 border-primary/20 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1">
            <div>
              <Badge variant="outline" className="text-[9px] bg-background">Option A (Primary)</Badge>
              <div className="font-bold text-foreground mt-1 truncate">{primaryTitle}</div>
            </div>
            <span className="font-black text-primary">{formatPHP(primaryPrice)}</span>
          </div>
          {primaryShopeeUrl && (
            <a
              href={primaryShopeeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-orange-500 hover:underline flex items-center gap-1 mt-1.5"
            >
              Listing Link <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>

        {/* Existing Alternatives */}
        {alternatives.map((alt, idx) => (
          <div key={alt.id} className="p-2.5 rounded-xl border bg-purple-500/5 border-purple-500/20 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1">
              <div>
                <div className="flex items-center gap-1">
                  <Badge variant="want" className="text-[9px]">Option {String.fromCharCode(66 + idx)}</Badge>
                  {alt.notes && (
                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                      • {alt.notes}
                    </span>
                  )}
                </div>
                <div className="font-bold text-foreground mt-1 truncate">{alt.title}</div>
              </div>
              <div className="text-right">
                <span className="font-black text-purple-600 dark:text-purple-400 block">
                  {formatPHP(alt.price)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteAlternative(alt.id)}
                  className="text-muted-foreground hover:text-destructive mt-1 inline-block"
                  title="Remove alternative"
                >
                  <Trash2 className="h-3 w-3" />
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

      {/* Add Alternative Inline Form */}
      {showAdd && (
        <form onSubmit={handleAddAlternative} className="mt-2.5 p-3 rounded-xl border bg-card space-y-2">
          <div className="font-bold text-muted-foreground text-[11px]">
            Compare with an alternative option (e.g. iPad Air vs iPad Mini):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              placeholder="Alternative title (e.g. iPad Mini 6)"
              value={altTitle}
              onChange={(e) => setAltTitle(e.target.value)}
              className="h-8 text-xs"
              required
            />
            <Input
              type="number"
              placeholder="Price (₱)"
              value={altPrice}
              onChange={(e) => setAltPrice(e.target.value)}
              className="h-8 text-xs"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              placeholder="Shopee / Lazada Link (Optional)"
              value={altUrl}
              onChange={(e) => setAltUrl(e.target.value)}
              className="h-8 text-xs"
            />
            <Input
              placeholder="Why this? (e.g. More portable, cheaper)"
              value={altNotes}
              onChange={(e) => setAltNotes(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs font-bold"
              disabled={submitting}
            >
              Save Alternative
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
