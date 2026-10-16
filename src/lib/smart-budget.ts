export interface BudgetCalculationInput {
  avgMonthlyIncome: number;
  monthlyBills: number;
  savingsRatePercent?: number; // default 20%
  items: {
    id: string;
    name: string;
    priority: number; // 1: Quick Wins, 2: Utility & Hobby, 3: Mid-Cost, 4: Large Purchases
    isNeed: boolean;
    currentPrice: number;
    status: string;
  }[];
}

export interface BudgetSuggestionResult {
  avgMonthlyIncome: number;
  monthlyBills: number;
  recommendedSavings: number;
  discretionarySurplus: number;
  suggestedWishlistBudget: number;
  activeItemsCount: number;
  totalActiveWishlistValue: number;
  quickWinsTotal: number;
  priorityBreakdown: {
    priority: number;
    title: string;
    totalAmount: number;
    count: number;
  }[];
  projectedMonthsToClearPriority1: number;
  projectedMonthsToClearAll: number;
  adviceMessage: string;
}

export function calculateSmartBudgetSuggestion(
  input: BudgetCalculationInput
): BudgetSuggestionResult {
  const {
    avgMonthlyIncome = 0,
    monthlyBills = 0,
    savingsRatePercent = 20,
    items = [],
  } = input;

  // 1. Calculate safe savings & surplus
  const recommendedSavings = (avgMonthlyIncome * Math.max(savingsRatePercent, 10)) / 100;
  const committedExpenses = monthlyBills + recommendedSavings;
  const discretionarySurplus = Math.max(0, avgMonthlyIncome - committedExpenses);

  // 2. Filter unpurchased active items
  const activeItems = items.filter(
    (item) => item.status !== "Purchased" && item.status !== "Archived"
  );

  const totalActiveWishlistValue = activeItems.reduce(
    (sum, i) => sum + i.currentPrice,
    0
  );

  const priority1Items = activeItems.filter((i) => i.priority === 1);
  const priority2Items = activeItems.filter((i) => i.priority === 2);
  const priority3Items = activeItems.filter((i) => i.priority === 3);
  const priority4Items = activeItems.filter((i) => i.priority === 4);

  const quickWinsTotal = priority1Items.reduce(
    (sum, i) => sum + i.currentPrice,
    0
  );

  const priorityBreakdown = [
    {
      priority: 1,
      title: "Priority 1: Quick Wins",
      totalAmount: quickWinsTotal,
      count: priority1Items.length,
    },
    {
      priority: 2,
      title: "Priority 2: Utility & Hobby",
      totalAmount: priority2Items.reduce((sum, i) => sum + i.currentPrice, 0),
      count: priority2Items.length,
    },
    {
      priority: 3,
      title: "Priority 3: Mid-Cost Wants",
      totalAmount: priority3Items.reduce((sum, i) => sum + i.currentPrice, 0),
      count: priority3Items.length,
    },
    {
      priority: 4,
      title: "Priority 4: Large Purchases",
      totalAmount: priority4Items.reduce((sum, i) => sum + i.currentPrice, 0),
      count: priority4Items.length,
    },
  ];

  // 3. Dynamic Wishlist Budget Formula:
  // Allocate up to 60-70% of discretionary surplus to wishlist, reserving 30% for unexpected pocket money.
  let suggestedWishlistBudget = 0;
  if (discretionarySurplus > 0) {
    if (discretionarySurplus <= 3000) {
      suggestedWishlistBudget = Math.round(discretionarySurplus * 0.7);
    } else if (discretionarySurplus <= 10000) {
      suggestedWishlistBudget = Math.round(discretionarySurplus * 0.55);
    } else {
      suggestedWishlistBudget = Math.round(discretionarySurplus * 0.45);
    }
  }

  // Cap at wishlist total if the entire active wishlist is cheaper than 1 month surplus
  if (totalActiveWishlistValue > 0 && suggestedWishlistBudget > totalActiveWishlistValue) {
    suggestedWishlistBudget = totalActiveWishlistValue;
  }

  // 4. Projections
  const projectedMonthsToClearPriority1 =
    suggestedWishlistBudget > 0
      ? Math.max(1, Math.ceil(quickWinsTotal / suggestedWishlistBudget))
      : 0;

  const projectedMonthsToClearAll =
    suggestedWishlistBudget > 0
      ? Math.max(1, Math.ceil(totalActiveWishlistValue / suggestedWishlistBudget))
      : 0;

  // 5. Contextual gamified advice message
  let adviceMessage = "";
  if (avgMonthlyIncome <= 0) {
    adviceMessage = "Enter your Average Monthly Income to unlock smart budget suggestions!";
  } else if (discretionarySurplus <= 0) {
    adviceMessage =
      "⚠️ Your bills & savings target currently absorb 100% of your income. Pause non-essential wants until surplus recovers.";
  } else if (quickWinsTotal > 0 && suggestedWishlistBudget >= quickWinsTotal) {
    adviceMessage = `🎉 Great financial health! Your ₱${suggestedWishlistBudget.toLocaleString()} suggested budget can unlock all your Priority 1 Quick Wins this very month debt-free!`;
  } else {
    adviceMessage = `💡 With ₱${suggestedWishlistBudget.toLocaleString()}/month allocated, you will clear your high-priority items in ~${projectedMonthsToClearPriority1} month(s) without compromising your emergency savings.`;
  }

  return {
    avgMonthlyIncome,
    monthlyBills,
    recommendedSavings,
    discretionarySurplus,
    suggestedWishlistBudget,
    activeItemsCount: activeItems.length,
    totalActiveWishlistValue,
    quickWinsTotal,
    priorityBreakdown,
    projectedMonthsToClearPriority1,
    projectedMonthsToClearAll,
    adviceMessage,
  };
}
