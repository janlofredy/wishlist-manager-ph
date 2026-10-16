export interface SaleEvent {
  id: string;
  name: string;
  type: "Double-Day" | "Payday" | "Mid-Month" | "Holiday";
  startDate: string; // YYYY-MM-DD
  discountAdvice: string;
  voucherTips: string[];
}

export function getUpcomingSaleEvents(): {
  event: SaleEvent;
  daysRemaining: number;
  isLive: boolean;
}[] {
  const today = new Date();
  const currentYear = today.getFullYear();

  // Standard Philippine E-Commerce Sales (Shopee / Lazada)
  const templates: Omit<SaleEvent, "startDate">[] = [
    {
      id: "payday-mid",
      name: "Mid-Month Payday Sale (15th)",
      type: "Payday",
      discountAdvice: "Shopee Payday 0-min free shipping vouchers available from 12 AM to 2 AM.",
      voucherTips: ["₱0 Min Spend Free Shipping", "15% Cashback ShopeePay voucher"],
    },
    {
      id: "payday-end",
      name: "Month-End Payday Sale (30th/31st)",
      type: "Payday",
      discountAdvice: "Electronics & hobby flash vouchers peak between 8 PM - 12 MN.",
      voucherTips: ["10% off Mall Electronics", "Free Shipping capped at ₱60"],
    },
    {
      id: "10-10",
      name: "10.10 Perfect 10 Brands Festival",
      type: "Double-Day",
      discountAdvice: "Best for tech & small appliances. Store vouchers stack with platform vouchers.",
      voucherTips: ["Mega Discount ₱1,000 off min ₱3,500", "Midnight Rush 50% Coins Cashback"],
    },
    {
      id: "11-11",
      name: "11.11 Mega Pamasko Sale (Biggest Sale of the Year)",
      type: "Double-Day",
      discountAdvice: "Deepest discounts on gadgets and appliances all year. Add to cart 3 days prior.",
      voucherTips: ["₱1,500 off min ₱4,000", "Claim vouchers starting Nov 7"],
    },
    {
      id: "12-12",
      name: "12.12 Christmas Grand Sale",
      type: "Double-Day",
      discountAdvice: "Great for Christmas gifts, personal care, and fashion clearance.",
      voucherTips: ["Last-minute Christmas Vouchers", "Free gift with purchase"],
    },
  ];

  const results = [];

  // Generate date for current/next cycles
  for (const t of templates) {
    let targetDate: Date;

    if (t.id === "payday-mid") {
      targetDate = new Date(currentYear, today.getMonth(), 15);
      if (today.getDate() > 15) {
        targetDate = new Date(currentYear, today.getMonth() + 1, 15);
      }
    } else if (t.id === "payday-end") {
      targetDate = new Date(currentYear, today.getMonth() + 1, 0); // Last day of month
      if (today.getDate() >= targetDate.getDate()) {
        targetDate = new Date(currentYear, today.getMonth() + 2, 0);
      }
    } else if (t.id === "10-10") {
      targetDate = new Date(currentYear, 9, 10);
    } else if (t.id === "11-11") {
      targetDate = new Date(currentYear, 10, 11);
    } else if (t.id === "12-12") {
      targetDate = new Date(currentYear, 11, 12);
    } else {
      targetDate = new Date();
    }

    const diffTime = targetDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isLive = daysRemaining === 0;

    results.push({
      event: {
        ...t,
        startDate: targetDate.toISOString().split("T")[0],
      },
      daysRemaining: Math.max(0, daysRemaining),
      isLive,
    });
  }

  // Sort by closest upcoming
  return results.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
