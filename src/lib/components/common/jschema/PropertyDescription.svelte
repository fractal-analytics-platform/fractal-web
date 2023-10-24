<script>
	import { onMount } from 'svelte';

	export let description = undefined;

	let element;

	onMount(() => {
		if (element) {
			// @ts-ignore
			// eslint-disable-next-line no-undef
			new bootstrap.Popover(element);
		}
	});
</script>

<span class="ms-2 property-description">
	{#if description}
		<span
			bind:this={element}
			tabindex="0"
			role="button"
			data-bs-trigger="focus"
			class="bi bi-info-circle text-primary"
			data-bs-toggle="popover"
			data-bs-content={description}
		/>
	{/if}
</span>
