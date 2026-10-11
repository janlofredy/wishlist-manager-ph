<script>
  export let events = [];
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
      <span>🛍️</span> Philippines Shopping Sale Calendar
    </h3>
    <span class="text-xs text-slate-500">Auto-calculated discount windows</span>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each events as event}
      <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between">
            <span class="font-bold text-base text-slate-900 dark:text-white">{event.name}</span>
            <span class="text-xs font-bold px-2 py-0.5 rounded-full {event.days_remaining <= 3 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-400'}">
              {event.days_remaining === 0 ? 'TODAY!' : `in ${event.days_remaining} days`}
            </span>
          </div>
          <div class="text-xs font-medium text-slate-400 mt-1">{event.date_str}</div>
          <p class="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
            {event.description}
          </p>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-500">Estimated Discount:</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400">{event.estimated_discount}</span>
          </div>
          <div class="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
            💡 {event.voucher_tip}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
