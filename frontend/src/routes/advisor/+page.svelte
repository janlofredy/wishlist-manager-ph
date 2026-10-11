<script>
  import { onMount } from 'svelte';
  import { apiRequest } from '$lib/api';
  import BuyAdvisorModal from '$lib/components/BuyAdvisorModal.svelte';

  let customBudget = 3000;
  let recommendations = [];
  let loading = false;
  let selectedResult = null;
  let isResultModalOpen = false;
  let loadingResult = false;

  onMount(async () => {
    await fetchAdvisor();
  });

  async function fetchAdvisor() {
    loading = true;
    try {
      recommendations = await apiRequest(`/advisor/what-should-i-buy?custom_budget=${customBudget}`);
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  async function inspectItem(item) {
    isResultModalOpen = true;
    loadingResult = true;
    try {
      selectedResult = await apiRequest(`/advisor/should-i-buy/${item.id}`);
    } catch (e) {
      alert(e.message);
      isResultModalOpen = false;
    } finally {
      loadingResult = false;
    }
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-black text-slate-900 dark:text-white">
      Purchase Advisor & Opportunity Cost Engine
    </h1>
    <p class="text-xs text-slate-500 mt-0.5">
      Algorithmic guidance enforcing delay on non-essential wants and prioritizing critical needs.
    </p>
  </div>

  <!-- Budget dial control -->
  <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
    <div>
      <div class="text-xs font-bold text-slate-500 uppercase">Simulated Available Budget</div>
      <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">
        ₱{customBudget.toLocaleString('en-PH')}
      </div>
    </div>
    <div class="flex items-center gap-3 w-full sm:w-auto">
      <input
        type="range"
        min="500"
        max="15000"
        step="500"
        bind:value={customBudget}
        on:change={fetchAdvisor}
        class="w-full sm:w-64 accent-blue-600"
      />
      <button
        on:click={fetchAdvisor}
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm"
      >
        Re-evaluate
      </button>
    </div>
  </div>

  <!-- Recommendations List -->
  <div class="space-y-3">
    {#if loading}
      <div class="py-12 text-center text-slate-400">Evaluating your active queue...</div>
    {:else if recommendations.length === 0}
      <div class="py-12 text-center text-slate-400">No active items to evaluate. Add items to your wishlist first!</div>
    {:else}
      {#each recommendations as rec}
        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-base text-slate-900 dark:text-white">{rec.item.name}</span>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-md {rec.item.classification === 'Need' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'}">
                {rec.item.classification}
              </span>
              <span class="text-xs text-slate-500">P{rec.item.priority}</span>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {rec.rationale}
            </p>
          </div>

          <div class="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
            <div class="text-right">
              <div class="text-base font-black text-slate-900 dark:text-white">
                ₱{(rec.item.current_price || rec.item.estimated_price).toLocaleString('en-PH')}
              </div>
              <div class="text-[11px] text-slate-500">Score: {rec.score.toFixed(0)}/100</div>
            </div>

            <div class="flex items-center gap-2">
              <span class="px-3 py-1 text-xs font-bold rounded-xl border {rec.recommendation === 'Buy Now' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300' : rec.recommendation === 'Wait For Sale' ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'}">
                {rec.recommendation}
              </span>
              <button
                on:click={() => inspectItem(rec.item)}
                class="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-xs rounded-xl"
              >
                Inspect
              </button>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<BuyAdvisorModal
  isOpen={isResultModalOpen}
  result={selectedResult}
  loading={loadingResult}
  on:close={() => (isResultModalOpen = false)}
/>
