<script>
  import { onMount } from 'svelte';
  import { apiRequest } from '$lib/api';
  import { wishlists, activeWishlistId } from '$lib/stores';
  import WishlistTable from '$lib/components/WishlistTable.svelte';
  import ItemModal from '$lib/components/ItemModal.svelte';
  import BuyAdvisorModal from '$lib/components/BuyAdvisorModal.svelte';

  let items = [];
  let isItemModalOpen = false;
  let editingItem = null;
  let isAdvisorModalOpen = false;
  let advisorResult = null;
  let advisorLoading = false;

  let selectedWishlist = 'all';
  let selectedClassification = 'all';
  let selectedCategory = 'all';
  let selectedStatus = 'all';
  let searchQuery = '';

  let newWishlistName = '';
  let newWishlistBudget = 3000;
  let isCreatingWishlist = false;

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      const [wList, iList] = await Promise.all([
        apiRequest('/wishlists'),
        apiRequest('/items'),
      ]);
      wishlists.set(wList);
      items = iList;
    } catch (e) {
      console.error(e);
    }
  }

  $: filteredItems = items.filter(item => {
    if (selectedWishlist !== 'all' && item.wishlist_id !== selectedWishlist) return false;
    if (selectedClassification !== 'all' && item.classification !== selectedClassification) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  async function handleCreateWishlist() {
    if (!newWishlistName.trim()) return;
    try {
      await apiRequest('/wishlists', {
        method: 'POST',
        body: JSON.stringify({
          name: newWishlistName,
          monthly_budget: Number(newWishlistBudget),
        }),
      });
      newWishlistName = '';
      isCreatingWishlist = false;
      await loadData();
    } catch (e) {
      alert(`Error creating wishlist: ${e.message}`);
    }
  }

  async function handleOpenAdvisor(item) {
    isAdvisorModalOpen = true;
    advisorLoading = true;
    try {
      advisorResult = await apiRequest(`/advisor/should-i-buy/${item.id}`);
    } catch (e) {
      alert(`Advisor error: ${e.message}`);
      isAdvisorModalOpen = false;
    } finally {
      advisorLoading = false;
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
      await loadData();
    } catch (e) {
      alert(`Save error: ${e.message}`);
    }
  }

  async function handleMarkPurchased(event) {
    try {
      await apiRequest(`/items/${event.detail}/purchase`, { method: 'POST' });
      await loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleRestorePurchased(event) {
    try {
      await apiRequest(`/items/${event.detail}/restore`, { method: 'POST' });
      await loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleDeleteItem(event) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await apiRequest(`/items/${event.detail}`, { method: 'DELETE' });
      await loadData();
    } catch (e) {
      alert(e.message);
    }
  }
</script>

<div class="space-y-6">
  <!-- Top bar & Wishlist management -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">
        Wishlists & Item Management
      </h1>
      <p class="text-xs text-slate-500 mt-0.5">
        Organize separate boards with dedicated budgets & Needs vs. Wants classification.
      </p>
    </div>
    <div class="flex items-center gap-2">
      <button
        on:click={() => (isCreatingWishlist = !isCreatingWishlist)}
        class="px-4 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition"
      >
        + New Wishlist Board
      </button>
      <button
        on:click={() => { editingItem = null; isItemModalOpen = true; }}
        class="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition"
      >
        + Add Item
      </button>
    </div>
  </div>

  {#if isCreatingWishlist}
    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-3">
      <input
        type="text"
        bind:value={newWishlistName}
        placeholder="Wishlist Name (e.g. Home Improvement, RC Hobby)"
        class="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
      />
      <input
        type="number"
        bind:value={newWishlistBudget}
        placeholder="Monthly Budget (₱)"
        class="w-40 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
      />
      <button
        on:click={handleCreateWishlist}
        class="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
      >
        Create Board
      </button>
    </div>
  {/if}

  <!-- Filters row -->
  <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
    <div>
      <label class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Search</label>
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search items..."
        class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs"
      />
    </div>

    <div>
      <label class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Board</label>
      <select bind:value={selectedWishlist} class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium">
        <option value="all">All Wishlists</option>
        {#each $wishlists as w}
          <option value={w.id}>{w.name}</option>
        {/each}
      </select>
    </div>

    <div>
      <label class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Classification</label>
      <select bind:value={selectedClassification} class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium">
        <option value="all">All (Needs & Wants)</option>
        <option value="Need">Needs Only</option>
        <option value="Want">Wants Only</option>
      </select>
    </div>

    <div>
      <label class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Status</label>
      <select bind:value={selectedStatus} class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium">
        <option value="all">All Statuses</option>
        <option value="Waiting">Waiting</option>
        <option value="Watching Sale">Watching Sale</option>
        <option value="Ready To Buy">Ready To Buy</option>
        <option value="Purchased">Purchased</option>
        <option value="Archived">Archived</option>
      </select>
    </div>

    <div class="flex items-end">
      <button
        on:click={() => { selectedWishlist = 'all'; selectedClassification = 'all'; selectedCategory = 'all'; selectedStatus = 'all'; searchQuery = ''; }}
        class="w-full py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold border border-slate-200 dark:border-slate-800 rounded-lg"
      >
        Reset Filters
      </button>
    </div>
  </div>

  <!-- Table -->
  <WishlistTable
    items={filteredItems}
    on:advisor={(e) => handleOpenAdvisor(e.detail)}
    on:edit={(e) => { editingItem = e.detail; isItemModalOpen = true; }}
    on:delete={handleDeleteItem}
    on:purchase={handleMarkPurchased}
    on:restore={handleRestorePurchased}
  />
</div>

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
