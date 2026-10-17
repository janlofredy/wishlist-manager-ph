"use client";

import { useState, useEffect } from "react";
import { formatPHP } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ExternalLink,
  Edit3,
  Calendar,
  Save,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { inferCategoryAndPriority, parseListingInput } from "@/lib/product-scraper";

interface ItemDetailModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated?: () => void;
}

export function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onItemUpdated,
}: ItemDetailModalProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsingUrl, setParsingUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states initialized with item values
  const [name, setName] = useState(item.name || "");
  const [category, setCategory] = useState(item.category || "General");
  const [priority, setPriority] = useState(item.priority?.toString() || "2");
  const [isNeed, setIsNeed] = useState<boolean>(Boolean(item.isNeed));
  const [currentPrice, setCurrentPrice] = useState(item.currentPrice?.toString() || "0");
  const [targetPrice, setTargetPrice] = useState(item.targetPrice ? item.targetPrice.toString() : "");
  const [notes, setNotes] = useState(item.notes || "");
  const [shopeeUrl, setShopeeUrl] = useState(item.shopeeUrl || "");
  const [status, setStatus] = useState(item.status || "Waiting");

  // Keep state synced when a different item is opened
  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setCategory(item.category || "General");
      setPriority(item.priority?.toString() || "2");
      setIsNeed(Boolean(item.isNeed));
      setCurrentPrice(item.currentPrice?.toString() || "0");
      setTargetPrice(item.targetPrice ? item.targetPrice.toString() : "");
      setNotes(item.notes || "");
      setShopeeUrl(item.shopeeUrl || "");
      setStatus(item.status || "Waiting");
      setIsEditing(false);
      setError(null);
    }
  }, [item, isOpen]);

  // Real-time re-identification when price changes
  const handlePriceChange = (val: string) => {
    setCurrentPrice(val);
    const parsedPrice = parseFloat(val) || 0;
    const inferred = inferCategoryAndPriority(name, parsedPrice);
    setPriority(inferred.priority.toString());
  };

  // Real-time re-identification when name changes
  const handleNameChange = (val: string) => {
    setName(val);
    if (val.trim().length > 2) {
      const parsedPrice = parseFloat(currentPrice) || 0;
      const inferred = inferCategoryAndPriority(val, parsedPrice);
      setCategory(inferred.category);
      setPriority(inferred.priority.toString());
    }
  };

  // Auto-evaluate link or pasted mobile share text
  const handleUrlBlur = async () => {
    if (!shopeeUrl.trim()) return;

    setParsingUrl(true);
    try {
      const parsed = parseListingInput(shopeeUrl);
      if (parsed.url) {
        setShopeeUrl(parsed.url);
      }
      if (parsed.title) {
        setName(parsed.title);
      }
      if (parsed.price) {
        setCurrentPrice(parsed.price.toString());
      }
      setCategory(parsed.category);
      setPriority(parsed.priority.toString());
    } finally {
      setParsingUrl(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/items/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          name,
          category,
          priority: parseInt(priority, 10),
          isNeed,
          currentPrice: parseFloat(currentPrice) || 0,
          targetPrice: targetPrice ? parseFloat(targetPrice) : null,
          notes,
          shopeeUrl,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update item");

      setIsEditing(false);
      router.refresh();
      if (onItemUpdated) onItemUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLabel = (p: number) => {
    switch (p) {
      case 1:
        return "Quick Win (<₱1.5k)";
      case 2:
        return "Hobby & Utility (₱1.5k-₱5k)";
      case 3:
        return "Mid-Cost (₱5k-₱15k)";
      case 4:
        return "Large Purchase (>₱15k)";
      default:
        return `P${p}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {isEditing ? "Edit Item Details" : "Item Details"}
            </DialogTitle>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-1.5 text-xs rounded-xl"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
          </div>
          <DialogDescription className="text-xs">
            {isEditing
              ? "Modify specifications, category, budget priority, or links. Priority auto-recalculates."
              : "Complete specifications, budget priority, and tracking status."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl">
            {error}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold block mb-1">
                Item Name / Title
              </label>
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Product name"
                required
                className="text-sm rounded-xl font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">
                  Current Price (₱)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={currentPrice}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="0.00"
                  required
                  className="text-sm rounded-xl font-bold text-primary"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Re-identifies priority tier automatically.
                </span>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">
                  Target / Sale Price (₱)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="Optional target sale price"
                  className="text-sm rounded-xl font-medium"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Triggers alert when sale price is reached.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Category</label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Electronics, Home, Tools..."
                  className="text-sm rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm rounded-xl border bg-background border-input font-medium"
                >
                  <option value="1">P1 - Quick Win (&lt;₱1.5k)</option>
                  <option value="2">P2 - Hobby &amp; Utility (₱1.5k-₱5k)</option>
                  <option value="3">P3 - Mid-Cost (₱5k-₱15k)</option>
                  <option value="4">P4 - Large Purchase (&gt;₱15k)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm rounded-xl border bg-background border-input"
                >
                  <option value="Waiting">Waiting</option>
                  <option value="Watching Sale">Watching Sale</option>
                  <option value="Ready To Buy">Ready To Buy</option>
                  <option value="Purchased">Purchased</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {/* Rebranded ⚡ Essential Want Checkbox */}
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="modal-is-need"
                  checked={isNeed}
                  onChange={(e) => setIsNeed(e.target.checked)}
                  className="rounded border-gray-300 text-primary h-4 w-4"
                />
                <label htmlFor="modal-is-need" className="text-xs font-semibold cursor-pointer">
                  Mark as ⚡ Essential Want
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold">
                  Shopee / Lazada Link or Share Text
                </label>
                {parsingUrl && (
                  <span className="text-[10px] text-primary flex items-center gap-1 font-medium">
                    <Loader2 className="h-3 w-3 animate-spin" /> Auto-evaluating link...
                  </span>
                )}
              </div>
              <Input
                type="text"
                value={shopeeUrl}
                onChange={(e) => setShopeeUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="Paste Shopee/Lazada link or copied share text..."
                className="text-sm rounded-xl"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Auto-evaluates product title, slug, and category on paste/blur.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Notes / Variants</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 256GB Space Gray, Buy on 11.11 sale"
                className="text-sm rounded-xl"
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={loading}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-1.5 rounded-xl font-bold">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-2">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge variant={item.isNeed ? "need" : "want"} className="gap-1 font-bold">
                  {item.isNeed ? "⚡ Essential Want" : "✨ Want"}
                </Badge>
                <Badge variant="outline" className="text-xs font-medium">
                  {getPriorityLabel(item.priority)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {item.category}
                </Badge>
                <Badge
                  className={
                    item.status === "Purchased"
                      ? "bg-emerald-500 text-white font-bold"
                      : "bg-muted text-muted-foreground font-medium"
                  }
                >
                  {item.status}
                </Badge>
              </div>
              <h2 className="text-lg font-black leading-snug">{item.name}</h2>
            </div>

            {/* Price Box */}
            <div className="p-3.5 rounded-xl border bg-muted/30 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Current Price
                </span>
                <span className="text-2xl font-black text-primary">
                  {formatPHP(item.currentPrice)}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Target / Sale Price
                </span>
                <span className="text-xl font-bold text-foreground">
                  {item.targetPrice ? formatPHP(item.targetPrice) : "None set"}
                </span>
                {item.targetPrice && item.currentPrice <= item.targetPrice && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                    🎯 Target reached!
                  </span>
                )}
              </div>
            </div>

            {/* Additional info */}
            {item.notes && (
              <div className="p-3 rounded-xl bg-background border text-xs">
                <span className="font-semibold text-muted-foreground block mb-0.5">Notes:</span>
                <p className="text-foreground">{item.notes}</p>
              </div>
            )}

            {item.shopeeUrl && (
              <div className="pt-1">
                <a
                  href={item.shopeeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-orange-500 hover:underline font-semibold bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20"
                >
                  View Official Store Listing <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            <div className="text-[11px] text-muted-foreground pt-2 flex items-center justify-between border-t">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Added: {new Date(item.createdAt).toLocaleDateString()}
              </span>
              {item.purchasedAt && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Bought: {new Date(item.purchasedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={onClose} className="rounded-xl">
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
