export interface DelayImpactInput {
  targetItemPrice: number;
  monthlyWishlistBudget: number;
  otherItems: {
    id: string;
    name: string;
    currentPrice: number;
    priority: number;
  }[];
}

export interface DelayedItem {
  id: string;
  name: string;
  currentPrice: number;
  priority: number;
  delayedByMonths: number;
}

export interface AdvisorRecommendation {
  verdict: "Buy Now" | "Wait For Sale" | "Save More" | "Avoid For Now";
  score: number; // 0 - 100
  reasoning: string;
  delayedItems: DelayedItem[];
  opportunityCostSummary: string;
}

export function evaluatePurchaseAdvisor(
  itemPrice: number,
  monthlyBudget: number,
  currentPrice: number,
  targetPrice: number | null,
  isNeed: boolean,
  otherItems: { id: string; name: string; currentPrice: number; priority: number }[]
): AdvisorRecommendation {
  if (monthlyBudget <= 0) {
    return {
      verdict: "Avoid For Now",
      score: 10,
      reasoning: "You have no active wishlist budget set for this month. Focus on building surplus first.",
      delayedItems: [],
      opportunityCostSummary: "Purchasing now would eat into committed bills or emergency savings.",
    };
  }

  // Calculate delay in months caused by this purchase
  const monthsOfBudget = itemPrice / monthlyBudget;
  const delayedItems: DelayedItem[] = otherItems
    .filter((i) => i.currentPrice > 0)
    .slice(0, 4)
    .map((other) => {
      const delay = Math.max(1, Math.round(monthsOfBudget));
      return {
        id: other.id,
        name: other.name,
        currentPrice: other.currentPrice,
        priority: other.priority,
        delayedByMonths: delay,
      };
    });

  // Target price reached or lower
  const isTargetMet = targetPrice !== null && currentPrice <= targetPrice;
  const budgetRatio = itemPrice / monthlyBudget;

  let verdict: AdvisorRecommendation["verdict"] = "Wait For Sale";
  let score = 50;
  let reasoning = "";

  if (isNeed && budgetRatio <= 1.0) {
    verdict = "Buy Now";
    score = 95;
    reasoning = "This is marked as an Essential Need (🛡️) and fits within your current month's budget.";
  } else if (isTargetMet && budgetRatio <= 0.8) {
    verdict = "Buy Now";
    score = 90;
    reasoning = `Target price of ₱${targetPrice} has been met and it accounts for only ${Math.round(budgetRatio * 100)}% of your monthly wishlist budget.`;
  } else if (budgetRatio <= 0.3) {
    verdict = "Buy Now";
    score = 85;
    reasoning = "Quick Win! Costs under 30% of your monthly pool with near-zero delay impact on other goals.";
  } else if (budgetRatio > 2.5) {
    verdict = "Avoid For Now";
    score = 25;
    reasoning = `This item requires over ${monthsOfBudget.toFixed(1)} months of your total wishlist budget. Buying now severely halts all other progress.`;
  } else if (budgetRatio > 1.0) {
    verdict = "Save More";
    score = 55;
    reasoning = `Costs ₱${itemPrice.toLocaleString()}, which exceeds this month's ₱${monthlyBudget.toLocaleString()} pool. Let rollover balance accumulate.`;
  } else {
    verdict = "Wait For Sale";
    score = 65;
    reasoning = "Price is stable. Awaiting upcoming Philippine Double-Day (10.10/11.11/12.12) or Payday sale voucher.";
  }

  const opportunityCostSummary =
    delayedItems.length > 0
      ? `Buying this item now delays ${delayedItems[0].name} by ~${delayedItems[0].delayedByMonths} month(s).`
      : "No major delays detected on other wishlist targets.";

  return {
    verdict,
    score,
    reasoning,
    delayedItems,
    opportunityCostSummary,
  };
}
