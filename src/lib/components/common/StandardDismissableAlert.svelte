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
		previousMessage = '';
		if (timeout) {
			clearTimeout(timeout);
		}
	}

	/** @type {string|undefined} */
	let previousMessage = $state('');

	/**
	 * @param {string} newMessage
	 */
	function handleMessageChange(newMessage) {
		if (newMessage !== previousMessage) {
			previousMessage = newMessage;
			if (newMessage === '') {
				hide();
			} else {
				setupTimeout();
			}
		}
	}

	$effect(() => {
		handleMessageChange(message);
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
		<button type="button" class="btn-close" aria-label="Close" onclick={hide}> </button>
	</div>
{/if}
