<script>
  import { onMount } from 'svelte';
  import { apiRequest } from '$lib/api';
  import { token, wishlists, activeWishlistId } from '$lib/stores';
  import DashboardWidgets from '$lib/components/DashboardWidgets.svelte';
  import WishlistTable from '$lib/components/WishlistTable.svelte';
  import ItemModal from '$lib/components/ItemModal.svelte';
  import BuyAdvisorModal from '$lib/components/BuyAdvisorModal.svelte';

  let items = [];
  let budgetSummary = null;
  let healthScore = null;
  let isItemModalOpen = false;
  let editingItem = null;
  let isAdvisorModalOpen = false;
  let advisorResult = null;
  let advisorLoading = false;
  let quickAdvisorAmount = 2500;
  let quickRecommendations = [];
  let loadingQuickAdvisor = false;

  onMount(async () => {
    if ($token) {
      await loadDashboardData();
    }
  });

  async function loadDashboardData() {
    try {
      const [wList, iList, bSum, hScore] = await Promise.all([
        apiRequest('/wishlists'),
        apiRequest('/items'),
        apiRequest('/budget/summary'),
        apiRequest('/advisor/health-score'),
      ]);

      wishlists.set(wList);
      if (wList.length > 0 && !$activeWishlistId) {
        activeWishlistId.set(wList[0].id);
      }

      items = iList;
      budgetSummary = bSum;
      healthScore = hScore;
    } catch (e) {
      console.error('Error loading dashboard:', e);
    }
  }

  $: needsCount = items.filter(i => i.classification === 'Need' && i.status !== 'Purchased').length;
  $: wantsCount = items.filter(i => i.classification === 'Want' && i.status !== 'Purchased').length;
  $: activeItems = items.filter(i => i.status !== 'Purchased' && i.status !== 'Archived');
  $: totalWishlistValue = activeItems.reduce((acc, i) => acc + (i.current_price || i.estimated_price), 0);
  $: purchasedValue = items.filter(i => i.status === 'Purchased').reduce((acc, i) => acc + (i.current_price || i.estimated_price), 0);

  async function handleOpenAdvisor(item) {
    isAdvisorModalOpen = true;
    advisorLoading = true;
    advisorResult = null;
    try {
      advisorResult = await apiRequest(`/advisor/should-i-buy/${item.id}`);
    } catch (e) {
      alert(`Advisor error: ${e.message}`);
      isAdvisorModalOpen = false;
    } finally {
      advisorLoading = false;
    }
  }

  async function handleRunQuickAdvisor() {
    loadingQuickAdvisor = true;
    try {
      quickRecommendations = await apiRequest(`/advisor/what-should-i-buy?custom_budget=${quickAdvisorAmount}`);
    } catch (e) {
      alert(`Error running advisor: ${e.message}`);
    } finally {
      loadingQuickAdvisor = false;
    }
  }

  async function handleSaveItem(event) {
    const data = event.detail;
    try {
      if (data.id) {
        await apiRequest(`/items/${data.id}`, { method: 'PUT', body: JSON.stringify(data) });
      } else {
        await apiRequest('/items', { method: 'POST', body: JSON.stringify(data) });
      }
      isItemModalOpen = false;
      await loadDashboardData();
    } catch (e) {
      alert(`Save error: ${e.message}`);
    }
  }

  async function handleMarkPurchased(event) {
    try {
      await apiRequest(`/items/${event.detail}/purchase`, { method: 'POST' });
      await loadDashboardData();
    } catch (e) {
      alert(`Purchase error: ${e.message}`);
    }
  }

  async function handleRestorePurchased(event) {
    try {
      await apiRequest(`/items/${event.detail}/restore`, { method: 'POST' });
      await loadDashboardData();
    } catch (e) {
      alert(`Restore error: ${e.message}`);
    }
  }

  async function handleDeleteItem(event) {
    if (!confirm('Are you sure you want to remove this item?')) return;
    try {
      await apiRequest(`/items/${event.detail}`, { method: 'DELETE' });
      await loadDashboardData();
    } catch (e) {
      alert(`Delete error: ${e.message}`);
    }
  }

  async function handlePreloadStarter() {
    try {
      const res = await apiRequest('/backups/preload-starter', { method: 'POST' });
      alert(`Successfully preloaded ${res.preloaded_count} starter wishlist items!`);
      await loadDashboardData();
    } catch (e) {
      alert(`Preload error: ${e.message}`);
    }
  }
</script>

<div class="space-y-8">
  <!-- Top bar header & Actions -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">
        Dashboard Overview
      </h1>
      <p class="text-xs text-slate-500 mt-1">
        Managing Philippine salary allocation & intentional spending.
      </p>
    </div>
    <div class="flex items-center gap-2">
      {#if items.length === 0}
        <button
          on:click={handlePreloadStarter}
          class="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm transition"
        >
          📦 Preload 26 Starter Items
        </button>
      {/if}
      <button
        on:click={() => { editingItem = null; isItemModalOpen = true; }}
        class="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition flex items-center gap-1.5"
      >
        <span>+</span> Add Wishlist Item
      </button>
    </div>
  </div>

  <!-- Metric Widgets -->
  <DashboardWidgets
    summary={budgetSummary}
    health={healthScore}
    itemsCount={activeItems.length}
    {needsCount}
    {wantsCount}
    {purchasedValue}
    {totalWishlistValue}
  />

  <!-- Interactive "I have PHP X: What Should I Buy?" Advisor Bar -->
  <div class="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md">
    <div class="max-w-3xl">
      <h2 class="text-lg font-bold flex items-center gap-2">
        <span>🤖</span> AI Purchase Advisor: "What Should I Buy?"
      </h2>
      <p class="text-xs text-blue-200 mt-1">
        Input your available discretionary cash to rank recommendations using priority, needs/wants balance, discount depth, and opportunity costs.
      </p>

      <div class="mt-4 flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-blue-300 font-bold">₱</span>
          <input
            type="number"
            bind:value={quickAdvisorAmount}
            placeholder="2,500"
            class="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-semibold"
          />
        </div>
        <button
          on:click={handleRunQuickAdvisor}
          disabled={loadingQuickAdvisor}
          class="px-6 py-2.5 bg-white text-blue-900 font-bold text-sm rounded-xl hover:bg-blue-50 transition shadow-sm"
        >
          {loadingQuickAdvisor ? 'Evaluating...' : 'Analyze Best Buys'}
        </button>
      </div>

      {#if quickRecommendations.length > 0}
        <div class="mt-4 pt-4 border-t border-white/10 space-y-2">
          <div class="text-xs font-bold uppercase tracking-wider text-blue-200">
            Top Recommendations for ₱{quickAdvisorAmount.toLocaleString('en-PH')}:
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {#each quickRecommendations.slice(0, 4) as rec}
              <div class="p-3 rounded-xl bg-white/10 border border-white/10 flex items-start justify-between text-xs">
                <div>
                  <div class="font-bold">{rec.item.name}</div>
                  <div class="text-blue-200 text-[11px]">{rec.rationale}</div>
                </div>
                <span class="font-bold px-2 py-0.5 rounded-md text-[10px] {rec.recommendation === 'Buy Now' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-900'}">
                  {rec.recommendation}
                </span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Main Active Wishlist Table -->
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="font-bold text-lg text-slate-900 dark:text-white">
        Active Priority Queue
      </h2>
      <a href="/items" class="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">
        View All / Filter Wishlists →
      </a>
    </div>

    <WishlistTable
      items={activeItems}
      on:advisor={(e) => handleOpenAdvisor(e.detail)}
      on:edit={(e) => { editingItem = e.detail; isItemModalOpen = true; }}
      on:delete={handleDeleteItem}
      on:purchase={handleMarkPurchased}
      on:restore={handleRestorePurchased}
    />
  </div>
</div>

<!-- Modals -->
<ItemModal
  isOpen={isItemModalOpen}
  item={editingItem}
  wishlists={$wishlists}
  on:close={() => (isItemModalOpen = false)}
  on:save={handleSaveItem}
/>

<BuyAdvisorModal
  isOpen={isAdvisorModalOpen}
  result={advisorResult}
  loading={advisorLoading}
  on:close={() => (isAdvisorModalOpen = false)}
/>
