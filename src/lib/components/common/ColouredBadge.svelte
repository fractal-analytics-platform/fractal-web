<script>
	import ColorHash from 'color-hash';

	/** @type {string | null} */
	export let value;

	/**
	 * @param {string} stringInput
	 */
	function getBackgroundColor(stringInput) {
		const colorHash = new ColorHash({ lightness: 0.8, saturation: 0.95 });
		return colorHash.hex(stringInput);
	}
</script>

{#if value}
	<span
		style="background-color: {getBackgroundColor(value)}"
		class="badge rounded-pill coloured-badge text-dark"
	>
		{value}
	</span>
{/if}
