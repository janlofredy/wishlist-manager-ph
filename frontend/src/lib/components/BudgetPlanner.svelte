<script>
  import { onMount } from 'svelte';
  import { apiRequest } from '$lib/api';

  export let budgetSummary = null;

  let monthlySalary = 18000;
  let monthlyBills = 10000;
  let savingsPercent = 20;
  let emergencyTarget = 50000;
  let wishlistBudget = 3000;
  let saving = false;
  let saveSuccess = false;

  $: if (budgetSummary) {
    monthlySalary = budgetSummary.monthly_salary;
    monthlyBills = budgetSummary.monthly_bills;
    emergencyTarget = budgetSummary.emergency_fund_target;
    wishlistBudget = budgetSummary.monthly_wishlist_budget;
  }

  async function handleSaveBudget() {
    saving = true;
    saveSuccess = false;
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const res = await apiRequest('/budget', {
        method: 'PUT',
        body: JSON.stringify({
          month: currentMonth,
          monthly_salary: Number(monthlySalary),
          monthly_bills: Number(monthlyBills),
          emergency_fund_target: Number(emergencyTarget),
          savings_allocation_percent: Number(savingsPercent),
          monthly_wishlist_budget: Number(wishlistBudget),
        }),
      });
      budgetSummary = res;
      saveSuccess = true;
      setTimeout(() => (saveSuccess = false), 3000);
    } catch (e) {
      alert(`Failed to save budget: ${e.message}`);
    } finally {
      saving = false;
    }
  }
</script>

<div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
        <span>🇵🇭</span> Monthly Budget & Carryover Planner
      </h3>
      <p class="text-xs text-slate-500 mt-0.5">
        Baseline optimized for Philippine salary allocation (Default PHP 18,000 / month).
      </p>
    </div>
    {#if saveSuccess}
      <span class="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
        ✓ Saved & Recalculated
      </span>
    {/if}
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div>
      <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Monthly Salary (₱)</label>
      <input
        type="number"
        bind:value={monthlySalary}
        class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white text-sm"
      />
    </div>

    <div>
      <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Monthly Fixed Bills (₱)</label>
      <input
        type="number"
        bind:value={monthlyBills}
        class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white text-sm"
      />
    </div>

    <div>
      <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Monthly Wishlist Fund (₱)</label>
      <input
        type="number"
        bind:value={wishlistBudget}
        class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white text-sm"
      />
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Savings Goal Percentage (%)</label>
      <input
        type="number"
        bind:value={savingsPercent}
        class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white text-sm"
      />
    </div>

    <div>
      <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Emergency Fund Target (₱)</label>
      <input
        type="number"
        bind:value={emergencyTarget}
        class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white text-sm"
      />
    </div>
  </div>

  <div class="flex justify-end pt-2">
    <button
      on:click={handleSaveBudget}
      disabled={saving}
      class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition disabled:opacity-50"
    >
      {saving ? 'Saving...' : 'Update Budget Plan'}
    </button>
  </div>
</div>
