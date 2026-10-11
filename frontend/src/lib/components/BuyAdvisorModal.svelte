<script>
  import { createEventDispatcher } from 'svelte';
  export let isOpen = false;
  export let result = null;
  export let loading = false;

  const dispatch = createEventDispatcher();

  function getVerdictStyle(v) {
    switch (v) {
      case 'Buy Now': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
      case 'Wait For Sale': return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
      case 'Save More': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300';
      default: return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300';
    }
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
    <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 class="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
          <span>🧠</span> Financial Decision Assistant
        </h3>
        <button on:click={() => dispatch('close')} class="text-slate-400 hover:text-slate-600 text-lg">✕</button>
      </div>

      <div class="p-6 space-y-5">
        {#if loading}
          <div class="py-12 text-center text-slate-500">
            <div class="animate-spin text-3xl inline-block mb-2">⏳</div>
            <div>Analyzing opportunity cost, priorities, and delay impacts...</div>
          </div>
        {:else if result}
          <!-- Item info & verdict badge -->
          <div class="flex items-start justify-between">
            <div>
              <div class="text-xs uppercase text-slate-500 font-semibold">Evaluation For</div>
              <div class="text-xl font-black text-slate-900 dark:text-white">{result.item_name}</div>
              <div class="text-sm font-semibold text-slate-600 dark:text-slate-400">
                ₱{result.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div class="px-3.5 py-1.5 rounded-xl border font-bold text-sm {getVerdictStyle(result.verdict)}">
              {result.verdict}
            </div>
          </div>

          <!-- Explanation box -->
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {result.explanation}
          </div>

          <!-- Delay impact list -->
          {#if result.delay_impacts && result.delay_impacts.length > 0}
            <div>
              <div class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                ⚠️ Consequences of Buying Now (Buy Delay Impact)
              </div>
              <div class="space-y-2">
                {#each result.delay_impacts as impact}
                  <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
                    <div>
                      <span class="font-semibold text-slate-800 dark:text-slate-200">{impact.item_name}</span>
                      <span class="ml-1 text-slate-500">({impact.classification})</span>
                    </div>
                    <div class="font-bold text-rose-600 dark:text-rose-400">
                      Delays by +{impact.months_delayed} mo
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {/if}
      </div>

      <div class="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <button on:click={() => dispatch('close')} class="px-5 py-2 text-sm font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl">
          Close Assistant
        </button>
      </div>
    </div>
  </div>
{/if}
