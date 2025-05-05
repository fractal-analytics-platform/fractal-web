<script>
	import { onMount } from 'svelte';

	
	/**
	 * @typedef {Object} Props
	 * @property {string | null} value
	 */

	/** @type {Props} */
	let { value } = $props();

	let ColorHash;

	/**
	 * @param {string} stringInput
	 */
	function getBackgroundColor(stringInput) {
		const colorHash = new ColorHash({ lightness: 0.8, saturation: 0.95 });
		return colorHash.hex(stringInput);
	}

	let mounted = $state(false);

	onMount(async () => {
		// Force rendering of coloured badge after SSR, to avoid issue with
		// color-hash dependency, that is available only client side.
		ColorHash = (await import('color-hash')).default;
		mounted = true;
	});
</script>

{#if value && mounted}
	<span
		style="background-color: {getBackgroundColor(value)}"
		class="badge rounded-pill coloured-badge text-dark"
	>
		{value}
	</span>
{/if}
