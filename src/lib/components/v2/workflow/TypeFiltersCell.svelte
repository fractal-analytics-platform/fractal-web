<script>
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';

	
	/**
	 * @typedef {Object} Props
	 * @property {{ [key: string]: boolean }} filters
	 */

	/** @type {Props} */
	let { filters } = $props();
</script>

{#each Object.entries(filters) as [key, value]}
	<div class="d-flex m-1">
		<div class="flex-fill pe-3">
			<code>{key}</code>
		</div>
		<div>
			<BooleanIcon {value} />
		</div>
	</div>
{/each}
