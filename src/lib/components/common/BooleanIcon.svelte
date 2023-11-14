<script>
	/** @type {boolean} */
	export let value;
</script>

{#if value}
	<span class="text-success">
		<i class="bi bi-check" />
	</span>
{:else}
	<span class="text-danger">
		<i class="bi bi-x" />
	</span>
{/if}

<style scoped>
.bi {
  font-size: 160%;
  font-weight: bold;
}
</style>