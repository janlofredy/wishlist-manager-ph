<script>
  import { createEventDispatcher } from 'svelte';
  export let items = [];

  const dispatch = createEventDispatcher();

  function getPriorityLabel(p) {
    switch (p) {
      case 1: return { text: 'P1: Quick Win', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' };
      case 2: return { text: 'P2: Utility/Hobby', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300' };
      case 3: return { text: 'P3: Mid Want', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300' };
      case 4: return { text: 'P4: Large Buy', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300' };
      default: return { text: `P${p}`, color: 'bg-slate-100 text-slate-800' };
    }
  }

  function getStatusLabel(s) {
    switch (s) {
      case 'Ready To Buy': return 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400';
      case 'Watching Sale': return 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400';
      case 'Purchased': return 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-400';
      case 'Archived': return 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300';
    }
  }
</script>

<div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
  <table class="w-full text-left text-sm text-slate-600 dark:text-slate-400">
    <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
      <tr>
        <th class="py-3.5 px-4">Item & Category</th>
        <th class="py-3.5 px-3">Classification</th>
        <th class="py-3.5 px-3">Priority</th>
        <th class="py-3.5 px-3">Current Price</th>
        <th class="py-3.5 px-3">Target Price</th>
        <th class="py-3.5 px-3">Status</th>
        <th class="py-3.5 px-4 text-right">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
      {#if items.length === 0}
        <tr>
          <td colspan="7" class="py-12 text-center text-slate-400">
            No items in this view. Click "Add Item" or "Preload Starter CSV" to get started!
          </td>
        </tr>
      {:else}
        {#each items as item (item.id)}
          {@const pMeta = getPriorityLabel(item.priority)}
          <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
            <td class="py-3.5 px-4">
              <div class="flex flex-col">
                <span class="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {item.name}
                  {#if item.shopee_url}
                    <a href={item.shopee_url} target="_blank" rel="noopener noreferrer" class="text-xs text-orange-500 hover:text-orange-600">
                      🛒
                    </a>
                  {/if}
                </span>
                <span class="text-xs text-slate-500">{item.category}</span>
              </div>
            </td>
            <td class="py-3.5 px-3">
              <span class="inline-flex px-2 py-0.5 text-xs rounded-md font-semibold {item.classification === 'Need' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'}">
                {item.classification}
              </span>
            </td>
            <td class="py-3.5 px-3">
              <span class="inline-flex px-2 py-0.5 text-xs rounded-md font-medium {pMeta.color}">
                {pMeta.text}
              </span>
            </td>
            <td class="py-3.5 px-3">
              <span class="font-bold text-slate-900 dark:text-slate-100">
                ₱{(item.current_price || item.estimated_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </td>
            <td class="py-3.5 px-3">
              <span class="text-xs text-slate-500">
                ₱{(item.target_price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </td>
            <td class="py-3.5 px-3">
              <span class="inline-flex px-2.5 py-0.5 text-xs rounded-full border {getStatusLabel(item.status)}">
                {item.status}
              </span>
            </td>
            <td class="py-3.5 px-4 text-right">
              <div class="flex items-center justify-end gap-1.5">
                <button
                  on:click={() => dispatch('advisor', item)}
                  title="Advisor analysis"
                  class="px-2 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/80 dark:text-blue-300 rounded-lg transition"
                >
                  Advisor
                </button>
                {#if item.status !== 'Purchased'}
                  <button
                    on:click={() => dispatch('purchase', item.id)}
                    title="Mark Purchased"
                    class="px-2 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-lg transition"
                  >
                    ✓ Buy
                  </button>
                {:else}
                  <button
                    on:click={() => dispatch('restore', item.id)}
                    title="Restore to active"
                    class="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 rounded-lg"
                  >
                    Restore
                  </button>
                {/if}
                <button
                  on:click={() => dispatch('edit', item)}
                  class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Edit item"
                >
                  ✎
                </button>
                <button
                  on:click={() => dispatch('delete', item.id)}
                  class="p-1 text-slate-400 hover:text-rose-600"
                  title="Delete item"
                >
                  ✕
                </button>
              </div>
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>
