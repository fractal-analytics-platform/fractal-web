<script>
	export let message;
	export let autoDismiss = true;

	let timeout;

	$: if (autoDismiss && message) {
		console.log(`alertMessage=${message}`)
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
	<div class="alert alert-success alert-dismissible fade show" role="alert">
		{message}
		<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" />
	</div>
{/if}
