<script>
	/** @type {boolean} */
	export let value;
</script>

{#if value}
	<span class="text-success" aria-checked="true">
		<i class="bi bi-check" />
	</span>
{:else}
	<span class="text-danger" aria-checked="false">
		<i class="bi bi-x" />
	</span>
{/if}

<style scoped>
.bi {
  font-size: 160%;
  font-weight: bold;
}
</style>