<script>
	/** @type {boolean|null|undefined} */
	export let value;
</script>

{#if value === true}
	<span class="text-success boolean-icon" aria-checked="true">
		<i class="bi bi-check" />
	</span>
{:else if value === false}
	<span class="text-danger boolean-icon" aria-checked="false">
		<i class="bi bi-x" />
	</span>
{/if}

<style scoped>
	.boolean-icon {
		font-size: 160%;
		font-weight: bold;
		margin: 0 -5px -5px -5px;
		line-height: 0;
		display: block;
	}
</style>
