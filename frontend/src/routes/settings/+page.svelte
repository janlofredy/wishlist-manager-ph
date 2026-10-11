<script>
  import { onMount } from 'svelte';
  import { apiRequest } from '$lib/api';

  let telegramChatId = '';
  let discordWebhookUrl = '';
  let enableTelegram = false;
  let enableDiscord = false;
  let saving = false;
  let saveSuccess = false;
  let isExporting = false;
  let fileInput;

  onMount(async () => {
    try {
      const s = await apiRequest('/system/settings');
      telegramChatId = s.telegram_chat_id || '';
      discordWebhookUrl = s.discord_webhook_url || '';
      enableTelegram = s.enable_telegram === 1;
      enableDiscord = s.enable_discord === 1;
    } catch (e) {
      console.error(e);
    }
  });

  async function handleSaveSettings() {
    saving = true;
    try {
      await apiRequest('/system/settings', {
        method: 'PUT',
        body: JSON.stringify({
          telegram_chat_id: telegramChatId,
          discord_webhook_url: discordWebhookUrl,
          enable_telegram: enableTelegram,
          enable_discord: enableDiscord,
        }),
      });
      saveSuccess = true;
      setTimeout(() => (saveSuccess = false), 3000);
    } catch (e) {
      alert(`Error saving settings: ${e.message}`);
    } finally {
      saving = false;
    }
  }

  async function handleDownloadCsv() {
    window.open('/api/backups/export/csv', '_blank');
  }

  async function handleDownloadJson() {
    try {
      const data = await apiRequest('/backups/export/json');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wishlist_manager_ph_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch (e) {
      alert(`Export error: ${e.message}`);
    }
  }

  async function handleCsvUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/backups/import/csv', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      alert(`Successfully imported ${data.imported_count} items from CSV!`);
    } catch (err) {
      alert(`Import error: ${err.message}`);
    }
  }
</script>

<div class="space-y-6 max-w-4xl">
  <div>
    <h1 class="text-2xl font-black text-slate-900 dark:text-white">
      System Settings & Notifications
    </h1>
    <p class="text-xs text-slate-500 mt-0.5">
      Configure alert webhooks, telegram notifications, CSV import/export, and database backups.
    </p>
  </div>

  <!-- Notification Channels Card -->
  <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
        <span>🔔</span> Alert Channels & Webhooks
      </h3>
      {#if saveSuccess}
        <span class="text-xs font-bold text-emerald-600">✓ Settings Saved</span>
      {/if}
    </div>

    <!-- Telegram -->
    <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span>✈️</span> Telegram Bot Notifications
        </label>
        <input type="checkbox" bind:checked={enableTelegram} class="rounded w-4 h-4 accent-blue-600" />
      </div>
      <p class="text-xs text-slate-500">Requires TELEGRAM_BOT_TOKEN set in backend environment.</p>
      <input
        type="text"
        bind:value={telegramChatId}
        placeholder="Telegram Chat ID (e.g. 12345678)"
        class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono"
      />
    </div>

    <!-- Discord -->
    <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span>🎮</span> Discord Webhook Integration
        </label>
        <input type="checkbox" bind:checked={enableDiscord} class="rounded w-4 h-4 accent-blue-600" />
      </div>
      <p class="text-xs text-slate-500">Post price drops and sale alerts straight to a Discord channel.</p>
      <input
        type="url"
        bind:value={discordWebhookUrl}
        placeholder="https://discord.com/api/webhooks/..."
        class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono"
      />
    </div>

    <div class="flex justify-end pt-2">
      <button
        on:click={handleSaveSettings}
        disabled={saving}
        class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm"
      >
        {saving ? 'Saving...' : 'Save Notification Settings'}
      </button>
    </div>
  </div>

  <!-- Backup & CSV Import/Export Card -->
  <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
    <h3 class="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
      <span>💾</span> Backup, CSV Import & Export
    </h3>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <button
        on:click={handleDownloadCsv}
        class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 text-left"
      >
        <div class="text-lg">📊</div>
        <div class="font-bold text-sm text-slate-900 dark:text-white mt-1">Export CSV</div>
        <div class="text-xs text-slate-500 mt-0.5">Download items and targets as spreadsheet</div>
      </button>

      <button
        on:click={handleDownloadJson}
        class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 text-left"
      >
        <div class="text-lg">📦</div>
        <div class="font-bold text-sm text-slate-900 dark:text-white mt-1">Export Full JSON</div>
        <div class="text-xs text-slate-500 mt-0.5">Complete database backup with wishlists</div>
      </button>

      <button
        on:click={() => fileInput.click()}
        class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 text-left"
      >
        <div class="text-lg">📥</div>
        <div class="font-bold text-sm text-slate-900 dark:text-white mt-1">Import CSV</div>
        <div class="text-xs text-slate-500 mt-0.5">Bulk upload items from CSV file</div>
      </button>

      <input
        type="file"
        accept=".csv"
        bind:this={fileInput}
        on:change={handleCsvUpload}
        class="hidden"
      />
    </div>
  </div>
</div>
