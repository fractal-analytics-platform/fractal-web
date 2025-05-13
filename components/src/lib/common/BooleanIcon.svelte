<script>
	
	/**
	 * @typedef {Object} Props
	 * @property {boolean|null} [value]
	 */

	/** @type {Props} */
	let { value } = $props();
</script>

{#if value === true}
	<span class="text-success boolean-icon" aria-checked="true">
		<i class="bi bi-check"></i>
	</span>
{:else if value === false}
	<span class="text-danger boolean-icon" aria-checked="false">
		<i class="bi bi-x"></i>
	</span>
{/if}

<style scoped>
	.boolean-icon {
		font-size: 160%;
		font-weight: bold;
		margin: 0 -5px -5px -5px;
		line-height: 0;
		display: inline-block;
	}
</style>
