<script>
	import { page } from '$app/stores';
	import Accounting from '$lib/components/admin/Accounting.svelte';
	import SlurmAccounting from '$lib/components/admin/SlurmAccounting.svelte';

	/** @type {'accounting'|'slurmAccounting'} */
	let selectedTab = 'accounting';
</script>

<h1 class="fw-light mb-3">Accounting</h1>

{#if $page.data.runnerBackend === 'slurm'}
	<ul class="nav nav-tabs">
		<li class="nav-item">
			<button
				class="nav-link"
				class:active={selectedTab === 'accounting'}
				on:click={() => (selectedTab = 'accounting')}
				aria-current={selectedTab === 'accounting' ? 'page' : undefined}
			>
				Accounting
			</button>
		</li>
		<li class="nav-item">
			<button
				class="nav-link"
				class:active={selectedTab === 'slurmAccounting'}
				on:click={() => (selectedTab = 'slurmAccounting')}
				aria-current={selectedTab === 'slurmAccounting' ? 'page' : undefined}
			>
				SLURM Accounting
			</button>
		</li>
	</ul>
{/if}

{#if selectedTab === 'accounting'}
	<Accounting users={$page.data.users} currentUserId={$page.data.userInfo.id} />
{:else if selectedTab === 'slurmAccounting'}
	{#if $page.data.runnerBackend === 'slurm'}
		<SlurmAccounting users={$page.data.users} currentUserId={$page.data.userInfo.id} />
	{/if}
{/if}
