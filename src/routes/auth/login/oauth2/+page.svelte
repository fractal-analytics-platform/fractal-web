<script>
	import { page } from '$app/state';
	const message = $derived(page.data.message);
</script>

<div class="container mt-4">
	{#if message}
		<div class="alert alert-info">
			{message}
		</div>
	{:else}
		Loading...
	{/if}
</div>
