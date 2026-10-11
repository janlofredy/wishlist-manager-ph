<script>
  export let summary = null;
  export let health = null;
  export let itemsCount = 0;
  export let needsCount = 0;
  export let wantsCount = 0;
  export let purchasedValue = 0;
  export let totalWishlistValue = 0;
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <!-- Widget: Available Wishlist Fund -->
  <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Wishlist Fund</span>
      <span class="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl text-lg">💰</span>
    </div>
    <div class="mt-3">
      <span class="text-2xl font-black text-slate-900 dark:text-white">
        ₱{(summary?.remaining_wishlist_fund ?? 3000).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <div class="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
        <span>Carryover: ₱{(summary?.carryover_amount ?? 0).toLocaleString('en-PH')}</span>
        <span>•</span>
        <span>Monthly: ₱{(summary?.monthly_wishlist_budget ?? 3000).toLocaleString('en-PH')}</span>
      </div>
    </div>
  </div>

  <!-- Widget: Wishlist Health Score -->
  <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Wishlist Health</span>
      <span class="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl text-lg">🛡️</span>
    </div>
    <div class="mt-3 flex items-baseline justify-between">
      <div>
        <span class="text-2xl font-black text-slate-900 dark:text-white">
          {health?.total_score ?? 85}<span class="text-sm font-medium text-slate-400">/100</span>
        </span>
        <div class="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
          Status: {health?.status ?? 'Good'}
        </div>
      </div>
      <div class="text-right text-[11px] text-slate-500">
        <div>Needs: <span class="font-bold text-amber-600 dark:text-amber-400">{needsCount}</span></div>
        <div>Wants: <span class="font-bold text-indigo-600 dark:text-indigo-400">{wantsCount}</span></div>
      </div>
    </div>
  </div>

  <!-- Widget: Total Wishlist Value -->
  <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Active Queue</span>
      <span class="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl text-lg">📋</span>
    </div>
    <div class="mt-3">
      <span class="text-2xl font-black text-slate-900 dark:text-white">
        ₱{totalWishlistValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <div class="mt-1 text-xs text-slate-500">
        <span>{itemsCount} items pending planning</span>
      </div>
    </div>
  </div>

  <!-- Widget: Total Purchased So Far -->
  <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Purchased Value</span>
      <span class="p-2 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl text-lg">🎉</span>
    </div>
    <div class="mt-3">
      <span class="text-2xl font-black text-slate-900 dark:text-white">
        ₱{purchasedValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <div class="mt-1 text-xs text-slate-500">
        <span>Disciplined acquisitions logged</span>
      </div>
    </div>
  </div>
</div>
