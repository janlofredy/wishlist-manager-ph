<script>
  import { onMount } from 'svelte';
  import { apiRequest } from '$lib/api';
  import SaleCalendar from '$lib/components/SaleCalendar.svelte';

  let events = [];
  let loading = true;

  onMount(async () => {
    try {
      events = await apiRequest('/system/sale-calendar');
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
      Philippines Sale Calendar
    </h1>
    <p class="text-xs text-slate-500 mt-0.5">
      Key dates for Payday Sales (15th / 30th) and Mega Double-Digit events (9.9, 10.10, 11.11, 12.12).
    </p>
  </div>

  {#if loading}
    <div class="py-12 text-center text-slate-400">Loading upcoming sales...</div>
  {:else}
    <SaleCalendar {events} />
  {/if}
</div>
