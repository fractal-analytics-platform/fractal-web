<script>
	/**
	 * @typedef {Object} Props
	 * @property {any} message
	 * @property {boolean} [autoDismiss]
	 * @property {'success'|'warning'} [alertType]
	 */

	/** @type {Props} */
	let { message = $bindable(), autoDismiss = true, alertType = 'success' } = $props();

	let timeout = $state();

	export function hide() {
		message = '';
	}

	/** @type {string|undefined} */
	let previousMessage = $state('');

	$effect(() => {
		if (message !== previousMessage) {
			previousMessage = message;
			setupTimeout();
		}
	});

	function setupTimeout() {
		if (!autoDismiss) {
			return;
		}
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(function () {
			hide();
			timeout = null;
		}, 3000);
	}
</script>

{#if message}
	<div class="alert alert-{alertType} alert-dismissible fade show" role="alert">
		{#if alertType === 'warning'}
			<i class="bi bi-exclamation-triangle"></i>
		{/if}
		{message}
		<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
	</div>
{/if}
