<script>
  import { user, logout, wishlists, activeWishlistId } from '$lib/stores';

  let isMobileMenuOpen = false;
</script>

<header class="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
    <!-- Brand -->
    <div class="flex items-center gap-3">
      <a href="/" class="flex items-center gap-2 group">
        <span class="text-2xl">🇵🇭</span>
        <div class="flex flex-col">
          <span class="font-bold text-lg leading-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Wishlist Manager PH
          </span>
          <span class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
            Anti-Impulse & Budget Planner
          </span>
        </div>
      </a>
    </div>

    <!-- Navigation links -->
    {#if $user}
      <nav class="hidden md:flex items-center gap-1 font-medium text-sm">
        <a href="/" class="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          Dashboard
        </a>
        <a href="/items" class="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          Wishlists
        </a>
        <a href="/budget" class="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          Budget Planner
        </a>
        <a href="/advisor" class="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          Purchase Advisor
        </a>
        <a href="/calendar" class="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          Sale Events
        </a>
        <a href="/settings" class="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          Settings
        </a>
      </nav>

      <!-- User actions -->
      <div class="hidden md:flex items-center gap-3">
        <span class="text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-300 font-medium">
          {$user.username} ({$user.role})
        </span>
        <button
          on:click={logout}
          class="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
        >
          Sign Out
        </button>
      </div>
    {/if}

    <!-- Mobile menu button -->
    <div class="flex md:hidden items-center">
      {#if $user}
        <button
          on:click={() => (isMobileMenuOpen = !isMobileMenuOpen)}
          class="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle menu"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {#if isMobileMenuOpen}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            {:else}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            {/if}
          </svg>
        </button>
      {/if}
    </div>
  </div>

  <!-- Mobile dropdown menu -->
  {#if isMobileMenuOpen && $user}
    <div class="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1">
      <a href="/" on:click={() => (isMobileMenuOpen = false)} class="block px-3 py-2 rounded-md text-base font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
        Dashboard
      </a>
      <a href="/items" on:click={() => (isMobileMenuOpen = false)} class="block px-3 py-2 rounded-md text-base font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
        Wishlists
      </a>
      <a href="/budget" on:click={() => (isMobileMenuOpen = false)} class="block px-3 py-2 rounded-md text-base font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
        Budget Planner
      </a>
      <a href="/advisor" on:click={() => (isMobileMenuOpen = false)} class="block px-3 py-2 rounded-md text-base font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
        Purchase Advisor
      </a>
      <a href="/calendar" on:click={() => (isMobileMenuOpen = false)} class="block px-3 py-2 rounded-md text-base font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
        Sale Events
      </a>
      <a href="/settings" on:click={() => (isMobileMenuOpen = false)} class="block px-3 py-2 rounded-md text-base font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
        Settings
      </a>
      <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <span class="text-xs text-slate-500">Signed in as {$user.username}</span>
        <button on:click={logout} class="text-xs text-rose-600 font-semibold">Sign Out</button>
      </div>
    </div>
  {/if}
</header>
