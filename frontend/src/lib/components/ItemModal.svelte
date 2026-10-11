<script>
  import { createEventDispatcher } from 'svelte';
  export let isOpen = false;
  export let item = null;
  export let wishlists = [];

  const dispatch = createEventDispatcher();

  let wishlist_id = '';
  let name = '';
  let category = 'Electronics';
  let classification = 'Want';
  let priority = 2;
  let estimated_price = 1000;
  let current_price = 1000;
  let target_price = 850;
  let status = 'Waiting';
  let notes = '';
  let shopee_url = '';

  const categories = [
    'Electronics', 'Desk Setup', 'Personal Care', 'Tools', 'Aquarium',
    'Hobby', 'Outdoor', 'Automotive', 'Kitchen', '3D Printing',
    'Cycling', 'Furniture', 'Entertainment', 'Home Improvement'
  ];

  $: if (item) {
    wishlist_id = item.wishlist_id || (wishlists[0]?.id || '');
    name = item.name || '';
    category = item.category || 'Electronics';
    classification = item.classification || 'Want';
    priority = item.priority || 2;
    estimated_price = item.estimated_price || 1000;
    current_price = item.current_price || estimated_price;
    target_price = item.target_price || Math.round(estimated_price * 0.85);
    status = item.status || 'Waiting';
    notes = item.notes || '';
    shopee_url = item.shopee_url || '';
  } else {
    wishlist_id = wishlists[0]?.id || '';
    name = '';
    category = 'Electronics';
    classification = 'Want';
    priority = 2;
    estimated_price = 1000;
    current_price = 1000;
    target_price = 850;
    status = 'Waiting';
    notes = '';
    shopee_url = '';
  }

  function handleSave() {
    if (!name.trim()) return;
    dispatch('save', {
      id: item?.id,
      wishlist_id,
      name,
      category,
      classification,
      priority: Number(priority),
      estimated_price: Number(estimated_price),
      current_price: Number(current_price),
      target_price: Number(target_price),
      status,
      notes,
      shopee_url,
    });
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
    <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 class="font-bold text-lg text-slate-900 dark:text-white">
          {item ? 'Edit Wishlist Item' : 'Add New Item'}
        </h3>
        <button on:click={() => dispatch('close')} class="text-slate-400 hover:text-slate-600 text-lg">✕</button>
      </div>

      <div class="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
        {#if wishlists.length > 1}
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Target Wishlist</label>
            <select bind:value={wishlist_id} class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm">
              {#each wishlists as w}
                <option value={w.id}>{w.name}</option>
              {/each}
            </select>
          </div>
        {/if}

        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Item Name *</label>
          <input
            type="text"
            bind:value={name}
            placeholder="e.g. Simplus Espresso Machine"
            class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Classification</label>
            <select bind:value={classification} class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm">
              <option value="Need">Need (Essential)</option>
              <option value="Want">Want (Non-essential)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
            <select bind:value={category} class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm">
              {#each categories as c}
                <option value={c}>{c}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Priority Level</label>
            <select bind:value={priority} class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm">
              <option value={1}>P1: Quick Win (&lt; ₱1,000)</option>
              <option value={2}>P2: Utility / Hobby (₱1,000 - ₱3,000)</option>
              <option value={3}>P3: Mid-Cost Want (₱3,000 - ₱7,000)</option>
              <option value={4}>P4: Large Purchase (&gt; ₱7,000)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
            <select bind:value={status} class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm">
              <option value="Waiting">Waiting</option>
              <option value="Watching Sale">Watching Sale</option>
              <option value="Ready To Buy">Ready To Buy</option>
              <option value="Purchased">Purchased</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Est. Price (₱)</label>
            <input type="number" bind:value={estimated_price} class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Current (₱)</label>
            <input type="number" bind:value={current_price} class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Target (₱)</label>
            <input type="number" bind:value={target_price} class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Shopee Philippines URL</label>
          <input
            type="url"
            bind:value={shopee_url}
            placeholder="https://shopee.ph/product-..."
            class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Notes / Reflection</label>
          <textarea
            bind:value={notes}
            rows="2"
            placeholder="Why do you want this? Does this solve an immediate problem?"
            class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm"
          ></textarea>
        </div>
      </div>

      <div class="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
        <button on:click={() => dispatch('close')} class="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
          Cancel
        </button>
        <button on:click={handleSave} class="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm">
          Save Item
        </button>
      </div>
    </div>
  </div>
{/if}
