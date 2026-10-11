<script>
  import { apiRequest } from '$lib/api';
  import { setAuth, token } from '$lib/stores';
  import { goto } from '$app/navigation';

  let isRegistering = false;
  let username = '';
  let email = '';
  let password = '';
  let errorMessage = '';
  let loading = false;

  async function handleSubmit() {
    errorMessage = '';
    loading = true;
    try {
      const endpoint = isRegistering ? '/auth/register' : '/auth/login';
      const body = isRegistering ? { username, email, password } : { username, password };
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setAuth(res.token, res.user);
      goto('/');
    } catch (e) {
      errorMessage = e.message || 'Authentication error';
    } finally {
      loading = false;
    }
  }
</script>

<div class="max-w-md mx-auto my-12 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
  <div class="text-center mb-8">
    <span class="text-4xl">🇵🇭</span>
    <h2 class="text-2xl font-black text-slate-900 dark:text-white mt-2">
      {isRegistering ? 'Create Your Account' : 'Welcome Back'}
    </h2>
    <p class="text-xs text-slate-500 mt-1">
      {isRegistering ? 'First registered user automatically receives Admin role.' : 'Sign in to access your Philippine wishlist and budget.'}
    </p>
  </div>

  {#if errorMessage}
    <div class="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 font-semibold">
      {errorMessage}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div>
      <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Username</label>
      <input
        type="text"
        bind:value={username}
        required
        class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
      />
    </div>

    {#if isRegistering}
      <div>
        <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
        <input
          type="email"
          bind:value={email}
          required
          class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
        />
      </div>
    {/if}

    <div>
      <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Password</label>
      <input
        type="password"
        bind:value={password}
        required
        class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
      />
    </div>

    <button
      type="submit"
      disabled={loading}
      class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50"
    >
      {loading ? 'Please wait...' : isRegistering ? 'Register Account' : 'Sign In'}
    </button>
  </form>

  <div class="mt-6 text-center text-xs text-slate-500">
    {#if isRegistering}
      Already have an account?
      <button on:click={() => (isRegistering = false)} class="font-bold text-blue-600 hover:underline ml-1">
        Sign In
      </button>
    {:else}
      First time setting up?
      <button on:click={() => (isRegistering = true)} class="font-bold text-blue-600 hover:underline ml-1">
        Register Admin
      </button>
    {/if}
  </div>
</div>
