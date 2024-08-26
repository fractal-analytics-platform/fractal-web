<script>
	export let message;
	export let autoDismiss = true;
	/** @type {'success'|'warning'} */
	export let alertType = 'success';

	let timeout;

	$: if (autoDismiss && message) {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(function () {
			hide();
			timeout = null;
		}, 3000);
	}

	export function hide() {
		message = '';
	}
</script>

{#if message}
	<div class="alert alert-{alertType} alert-dismissible fade show" role="alert">
		{#if alertType === 'warning'}
			<i class="bi bi-exclamation-triangle" />
		{/if}
		{message}
		<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" />
	</div>
{/if}
