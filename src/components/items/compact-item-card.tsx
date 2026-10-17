"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPHP } from "@/lib/utils";
import {
  Trash2,
  CheckCircle,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ItemAlternativesSection } from "@/components/items/item-alternatives-section";
import { ItemDetailModal } from "@/components/items/item-detail-modal";

interface CompactItemCardProps {
  item: any;
  availableItemsToPick: any[];
  attachedAlternatives: any[];
  onMarkPurchased: (id: string) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export function CompactItemCard({
  item,
  availableItemsToPick,
  attachedAlternatives,
  onMarkPurchased,
  onDeleteItem,
}: CompactItemCardProps) {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const getPriorityLabel = (p: number) => {
    switch (p) {
      case 1:
        return "Quick Win";
      case 2:
        return "Hobby & Utility";
      case 3:
        return "Mid-Cost";
      case 4:
        return "Large Purchase";
      default:
        return `Priority ${p}`;
    }
  };

  return (
    <Card className="p-3 transition-all hover:border-primary/40 group overflow-hidden">
      {/* Compact Main Row - clicking outside title/buttons toggles alternatives */}
      <div
        onClick={() => setShowAlternatives((prev) => !prev)}
        className="flex items-center justify-between gap-3 min-w-0 cursor-pointer select-none"
      >
        {/* Left: Badge + Title + Category */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Essential Want vs Want emoji pill */}
          <Badge
            variant={item.isNeed ? "need" : "want"}
            className="text-xs px-1.5 py-0.5 h-6 shrink-0 font-bold inline-flex items-center justify-center cursor-default select-none"
            title={item.isNeed ? "⚡ Essential Want (Almost a need)" : "✨ Want"}
          >
            {item.isNeed ? "⚡" : "✨"}
          </Badge>

          {/* Clickable Title to open details modal */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailModalOpen(true);
                }}
                className="font-bold text-sm text-foreground hover:text-primary transition-colors truncate block max-w-full text-left cursor-pointer"
                title="Click to view details and edit"
              >
                {item.name}
              </button>
              {item.notes && (
                <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded shrink-0 hidden md:inline">
                  {item.notes}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
              <span>{item.category}</span>
              <span>•</span>
              <span className="text-foreground/80 font-medium">{getPriorityLabel(item.priority)}</span>
              {attachedAlternatives.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-purple-600 dark:text-purple-400 font-medium flex items-center gap-0.5">
                    <Layers className="h-2.5 w-2.5" /> {attachedAlternatives.length} alt{attachedAlternatives.length > 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Price + Quick Actions */}
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <div className="text-right shrink-0">
            <span className="font-black text-sm md:text-base text-primary whitespace-nowrap block">
              {formatPHP(item.currentPrice)}
            </span>
            {item.targetPrice ? (
              <span className="text-[10px] text-muted-foreground block -mt-0.5 whitespace-nowrap">
                Target: {formatPHP(item.targetPrice)}
              </span>
            ) : null}
          </div>

          <div
            className="flex items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {item.status !== "Purchased" && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onMarkPurchased(item.id)}
                className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 rounded-lg"
                title="Mark as Bought"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onDeleteItem(item.id)}
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
              title="Delete Item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

            {/* Toggle alternatives drawer */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowAlternatives((prev) => !prev)}
              className="h-7 w-7 text-muted-foreground rounded-lg"
              title={showAlternatives ? "Hide Alternatives" : "Show Alternatives"}
            >
              {showAlternatives ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Expandable Alternatives Drawer */}
      {showAlternatives && (
        <div className="mt-2.5 pt-2.5 border-t">
          <ItemAlternativesSection
            primaryItem={item}
            availableItemsToPick={availableItemsToPick}
            attachedAlternatives={attachedAlternatives}
          />
        </div>
      )}

      {/* Details & Edit Modal */}
      <ItemDetailModal
        item={item}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
      />
    </Card>
  );
}
