<script>
	export let error = undefined;

	/** @type {string | undefined} */
	$: errorString = JSON.stringify(error, undefined, 2);
</script>

{#if errorString}
	<div class="alert alert-danger alert-dismissible">
		<pre>There has been an error, reason:</pre>
		<pre>{errorString}</pre>
		<button class="btn-close" data-bs-dismiss="alert" on:click={(errorString = undefined)} />
	</div>
{/if}
