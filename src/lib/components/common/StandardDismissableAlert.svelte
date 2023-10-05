<script>
	export let message;
	export let autoDismiss = true;

	$: if (autoDismiss && message) setTimeout(hide, 3000);

	export function hide() {
		message = '';
	}
</script>

{#if message}
	<div class="alert alert-success alert-dismissible fade show" role="alert">
		{message}
		<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" />
	</div>
{/if}
