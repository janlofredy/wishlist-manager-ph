"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { inferCategoryAndPriority } from "@/lib/product-scraper";
import { Sparkles, Link2, Loader2, Plus, ShieldCheck, Tag } from "lucide-react";

interface SmartItemFormProps {
  wishlistId: string;
  onItemAdded?: () => void;
}

export function SmartItemForm({ wishlistId }: SmartItemFormProps) {
  const [productUrl, setProductUrl] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState(2);
  const [isNeed, setIsNeed] = useState(false); // Default: Want (false)
  const [selectedVariation, setSelectedVariation] = useState("");
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Auto-fetch price & title when URL is pasted
  async function handleUrlBlur() {
    if (!productUrl || (!productUrl.includes("shopee.ph") && !productUrl.includes("lazada"))) {
      return;
    }

    setLoading(true);
    setStatusMessage("Extracting listing details...");

    try {
      const res = await fetch("/api/scrape-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: productUrl }),
      });

      const data = await res.json();

      if (data.title && !name) {
        setName(data.title);
      }
      if (data.price) {
        setPrice(data.price.toString());
      }
      if (data.priceRange) {
        setPriceRange(data.priceRange);
      }
      if (data.suggestedCategory) {
        setCategory(data.suggestedCategory);
      }
      if (data.suggestedPriority) {
        setPriority(data.suggestedPriority);
      }

      if (data.error) {
        setStatusMessage(data.error);
      } else if (data.priceRange) {
        setStatusMessage(`⚡ Variations detected (${data.priceRange}). Base price loaded, adjust if choosing a higher tier.`);
      } else {
        setStatusMessage("✅ Auto-filled price, tags, and category!");
      }
    } catch (err: any) {
      setStatusMessage("Could not auto-fetch. You can enter details manually below.");
    } finally {
      setLoading(false);
    }
  }

  // When user types a manual product name, auto-suggest category & priority
  function handleNameChange(newName: string) {
    setName(newName);
    if (newName.length > 2) {
      const currentPriceNum = parseFloat(price) || 0;
      const inferred = inferCategoryAndPriority(newName, currentPriceNum);
      setCategory(inferred.category);
      setPriority(inferred.priority);
    }
  }

  // When user changes price, recalculate priority tier
  function handlePriceChange(newPrice: string) {
    setPrice(newPrice);
    const num = parseFloat(newPrice) || 0;
    if (name.length > 2) {
      const inferred = inferCategoryAndPriority(name, num);
      setPriority(inferred.priority);
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/items/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wishlistId,
          shopeeUrl: productUrl || null,
          name: name || null,
          price: parseFloat(price) || 0,
          targetPrice: targetPrice ? parseFloat(targetPrice) : null,
          category,
          priority,
          isNeed,
          variation: selectedVariation || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save item");
      }

      // Reset form and reload list
      setProductUrl("");
      setName("");
      setPrice("");
      setTargetPrice("");
      setSelectedVariation("");
      setPriceRange(null);
      setIsNeed(false);
      window.location.reload();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="p-6 h-fit border-2 border-primary/20 shadow-md">
      <CardHeader className="p-0 mb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" /> Smart Item Form
          </CardTitle>
          <Badge variant={isNeed ? "need" : "want"} className="font-bold">
            {isNeed ? "🛡️ Need" : "✨ Default: Want"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Paste a Shopee/Lazada link for auto-pricing, or type name & price directly.
        </p>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <input type="hidden" name="wishlistId" value={wishlistId} />

        {/* 1. Shopee / Lazada URL Input */}
        <div>
          <label className="text-xs font-bold text-muted-foreground flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-primary" /> Shopee or Lazada Link (Auto-Fetcher)
            </span>
            {loading && (
              <span className="text-[10px] text-primary flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Fetching...
              </span>
            )}
          </label>
          <Input
            name="shopeeUrl"
            placeholder="https://shopee.ph/product/... or Lazada link"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            onBlur={handleUrlBlur}
          />
          {statusMessage && (
            <span className="text-[11px] font-medium text-muted-foreground mt-1 block">
              {statusMessage}
            </span>
          )}
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-muted"></div>
          <span className="flex-shrink mx-2 text-[10px] uppercase font-bold text-muted-foreground">
            or manual item details
          </span>
          <div className="flex-grow border-t border-muted"></div>
        </div>

        {/* 2. Direct Product Name & Variation */}
        <div>
          <label className="text-xs font-bold text-muted-foreground block mb-1">
            Product Name {productUrl ? "(Auto-detected or custom)" : "(Required if no link)"}
          </label>
          <Input
            name="name"
            placeholder={productUrl ? "Will use listing title if left blank" : "e.g. Simplus Coffee Grinder"}
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required={!productUrl}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground flex items-center justify-between mb-1">
            <span>Selected Variation / Option (Optional)</span>
            {priceRange && (
              <span className="text-[10px] text-orange-500 font-bold">
                Range: {priceRange}
              </span>
            )}
          </label>
          <Input
            name="variation"
            placeholder="e.g. Black / 256GB / Size L"
            value={selectedVariation}
            onChange={(e) => setSelectedVariation(e.target.value)}
          />
        </div>

        {/* 3. Pricing */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Price (PHP ₱) {productUrl && !price ? "(Auto-fetching...)" : ""}
            </label>
            <Input
              name="price"
              type="number"
              step="10"
              placeholder={productUrl ? "Auto-fetches from link" : "e.g. 1200"}
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Target Price (₱)
            </label>
            <Input
              name="targetPrice"
              type="number"
              step="10"
              placeholder="Optional target"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
            />
          </div>
        </div>

        {/* 4. Automated Tags & Types */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Category Tag
            </label>
            <Input
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Auto-detected tag"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Priority Tier
            </label>
            <select
              name="priority"
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
            >
              <option value="1">1: Quick Win (&lt; ₱1.5k)</option>
              <option value="2">2: Utility & Hobby</option>
              <option value="3">3: Mid-Cost Want</option>
              <option value="4">4: Large Purchase</option>
            </select>
          </div>
        </div>

        {/* 5. Need vs Want Checkbox (Default: Want) */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 border">
          <input
            type="checkbox"
            id="isNeedCheck"
            name="isNeed"
            checked={isNeed}
            onChange={(e) => setIsNeed(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label
            htmlFor="isNeedCheck"
            className="text-xs font-bold text-foreground cursor-pointer select-none"
          >
            🛡️ Mark as Essential Need (Unchecked = ✨ Want)
          </label>
        </div>

        <Button type="submit" className="w-full font-bold rounded-xl gap-2 shadow-md" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> Add to Wishlist
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
