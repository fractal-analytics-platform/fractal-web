<script>
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';

	/** @type {{ [key: string]: boolean }} */
	export let filters;

	export let selectedTypeFilter = '';
</script>

{#each Object.entries(filters) as [key, value]}
	{#if selectedTypeFilter === '' || key === selectedTypeFilter}
		<div class="d-flex m-1">
			<div class="flex-fill pe-3">
				<code>{key}</code>
			</div>
			<div>
				<BooleanIcon {value} />
			</div>
		</div>
	{/if}
{/each}
