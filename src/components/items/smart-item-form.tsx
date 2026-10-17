"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { inferCategoryAndPriority, parseListingInput } from "@/lib/product-scraper";
import { Sparkles, Link2, Loader2, Plus, Zap } from "lucide-react";

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
  const [isNeed, setIsNeed] = useState(false); // Default: Want (false), Checked: Essential Want (true)
  const [selectedVariation, setSelectedVariation] = useState("");
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Smart parser: runs instantly when user pastes a link or copied mobile share text
  function handleUrlChange(rawInput: string) {
    setProductUrl(rawInput);

    if (rawInput.trim().length > 5) {
      const parsed = parseListingInput(rawInput);
      if (parsed.extractedFromText) {
        if (parsed.url) {
          setProductUrl(parsed.url);
        }
        if (parsed.title) {
          setName(parsed.title);
        }
        if (parsed.price) {
          setPrice(parsed.price.toString());
        }
        setCategory(parsed.category);
        setPriority(parsed.priority);

        if (parsed.price) {
          setStatusMessage("⚡ Auto-extracted title & price from share text!");
        } else {
          setStatusMessage("✅ Title loaded from link slug! Enter price below.");
        }
      }
    }
  }

  // Fallback server scraper when user blurs URL input
  async function handleUrlBlur() {
    if (!productUrl || (!productUrl.includes("shopee.ph") && !productUrl.includes("lazada"))) {
      return;
    }

    // If price is already populated from share text, don't spam the scraper
    if (price && parseFloat(price) > 0) return;

    setLoading(true);

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

      if (data.priceRange) {
        setStatusMessage(`⚡ Variations detected (${data.priceRange}). Adjust price if picking a specific tier.`);
      } else if (data.price) {
        setStatusMessage("✅ Auto-filled price from listing!");
      }
    } catch {
      // Keep client-extracted slug and let user enter price
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

  // When user changes price, recalculate priority tier in real time
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
    <Card className="p-5 h-fit border-2 border-primary/20 shadow-md">
      <CardHeader className="p-0 mb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" /> Add to Wishlist
          </CardTitle>
          <Badge variant={isNeed ? "need" : "want"} className="font-bold">
            {isNeed ? "⚡ Essential Want" : "✨ Want"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Paste a Shopee/Lazada link or copied share message, or enter details manually.
        </p>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
        <input type="hidden" name="wishlistId" value={wishlistId} />

        {/* 1. Shopee / Lazada URL or Copied Share Text Input */}
        <div>
          <label className="text-xs font-bold text-muted-foreground flex items-center justify-between mb-1">
            <span className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-primary" /> Listing Link or Mobile Share Text
            </span>
            {loading && (
              <span className="text-[10px] text-primary flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Fetching...
              </span>
            )}
          </label>
          <Input
            name="shopeeUrl"
            placeholder="Paste link or share snippet (e.g. Check out ... ₱1,200)"
            value={productUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            onBlur={handleUrlBlur}
            className="rounded-xl text-xs"
          />
          {statusMessage && (
            <span className="text-[11px] font-semibold text-primary mt-1 block">
              {statusMessage}
            </span>
          )}
        </div>

        <div className="relative flex py-0.5 items-center">
          <div className="flex-grow border-t border-muted"></div>
          <span className="flex-shrink mx-2 text-[10px] uppercase font-bold text-muted-foreground">
            or manual item details
          </span>
          <div className="flex-grow border-t border-muted"></div>
        </div>

        {/* 2. Direct Product Name & Variation */}
        <div>
          <label className="text-xs font-bold text-muted-foreground block mb-1">
            Product Name {productUrl ? "(Auto-detected or custom)" : "(Required)"}
          </label>
          <Input
            name="name"
            placeholder={productUrl ? "Will use listing title if left blank" : "e.g. Simplus Coffee Grinder"}
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required={!productUrl}
            className="rounded-xl"
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
            className="rounded-xl"
          />
        </div>

        {/* 3. Pricing */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Price (PHP ₱)
            </label>
            <Input
              name="price"
              type="number"
              step="10"
              placeholder="e.g. 1200"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              className="rounded-xl font-bold"
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
              className="rounded-xl"
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
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Priority Tier
            </label>
            <select
              name="priority"
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-medium"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
            >
              <option value="1">P1 - Quick Win (&lt;₱1.5k)</option>
              <option value="2">P2 - Hobby &amp; Utility (₱1.5k-₱5k)</option>
              <option value="3">P3 - Mid-Cost (₱5k-₱15k)</option>
              <option value="4">P4 - Large Purchase (&gt;₱15k)</option>
            </select>
          </div>
        </div>

        {/* 5. ⚡ Essential Want Checkbox (Default: ✨ Want) */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 border">
          <input
            type="checkbox"
            id="isNeedCheck"
            name="isNeed"
            checked={isNeed}
            onChange={(e) => setIsNeed(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
          />
          <label
            htmlFor="isNeedCheck"
            className="text-xs font-bold text-foreground cursor-pointer select-none"
          >
            Mark as ⚡ Essential Want (Almost a need)
          </label>
        </div>

        <Button
          type="submit"
          className="w-full font-bold rounded-xl gap-2 shadow-md"
          disabled={isSubmitting}
        >
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
