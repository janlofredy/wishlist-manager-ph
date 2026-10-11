<script>
  import '../app.css';
  import Navbar from '$lib/components/Navbar.svelte';
  import { user, token } from '$lib/stores';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    if (!$token && $page.url.pathname !== '/login') {
      goto('/login');
    }
  });
</script>

<div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
  <Navbar />
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <slot />
  </main>
  <footer class="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
    <p>Wishlist Manager PH • Built for Philippine salary-earners to avoid impulse buys and achieve disciplined purchases.</p>
  </footer>
</div>
