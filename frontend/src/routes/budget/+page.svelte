<script>
  import { onMount } from 'svelte';
  import { apiRequest } from '$lib/api';
  import BudgetPlanner from '$lib/components/BudgetPlanner.svelte';

  let summary = null;
  let loading = true;

  onMount(async () => {
    try {
      summary = await apiRequest('/budget/summary');
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  });
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-black text-slate-900 dark:text-white">
      Budget & Carryover Engine
    </h1>
    <p class="text-xs text-slate-500 mt-0.5">
      Unused wishlist budget automatically rolls over into consecutive months.
    </p>
  </div>

  {#if !loading && summary}
    <!-- Visual Ledger Breakdown Card -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div class="text-xs text-slate-500 uppercase font-semibold">1. Salary & Bills</div>
        <div class="mt-2 text-xl font-black text-slate-900 dark:text-white">
          ₱{summary.monthly_salary.toLocaleString('en-PH')}
        </div>
        <div class="text-xs text-slate-500 mt-1">
          Bills: ₱{summary.monthly_bills.toLocaleString('en-PH')}
        </div>
      </div>

      <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div class="text-xs text-slate-500 uppercase font-semibold">2. Savings Allocation (20%)</div>
        <div class="mt-2 text-xl font-black text-emerald-600 dark:text-emerald-400">
          ₱{summary.savings_target.toLocaleString('en-PH')}
        </div>
        <div class="text-xs text-slate-500 mt-1">
          Target: ₱{summary.emergency_fund_target.toLocaleString('en-PH')}
        </div>
      </div>

      <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div class="text-xs text-slate-500 uppercase font-semibold">3. Previous Carryover</div>
        <div class="mt-2 text-xl font-black text-blue-600 dark:text-blue-400">
          ₱{summary.carryover_amount.toLocaleString('en-PH')}
        </div>
        <div class="text-xs text-slate-500 mt-1">
          Rolled over from last month
        </div>
      </div>

      <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div class="text-xs text-slate-500 uppercase font-semibold">4. Available Wishlist Fund</div>
        <div class="mt-2 text-xl font-black text-indigo-600 dark:text-indigo-400">
          ₱{summary.remaining_wishlist_fund.toLocaleString('en-PH')}
        </div>
        <div class="text-xs text-slate-500 mt-1">
          Spent this month: ₱{summary.spent_amount.toLocaleString('en-PH')}
        </div>
      </div>
    </div>

    <BudgetPlanner bind:budgetSummary={summary} />
  {/if}
</div>
