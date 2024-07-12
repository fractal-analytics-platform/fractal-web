<script>
	import { AlertError } from '$lib/common/errors';

	export let error = undefined;

	let errorString = '';
	let formatAsPre = false;

	$: if (error) {
		updateErrorMessage();
	}

	function updateErrorMessage() {
		if (error instanceof AlertError) {
			const simpleMessage = error.getSimpleValidationMessage();
			if (simpleMessage) {
				errorString = simpleMessage;
				formatAsPre = false;
			} else if (typeof error.reason === 'string') {
				errorString = error.reason;
				formatAsPre = false;
			} else if ('detail' in error.reason && typeof error.reason.detail === 'string') {
				errorString = error.reason.detail;
				formatAsPre = false;
			} else {
				errorString = JSON.stringify(error.reason, undefined, 2);
				formatAsPre = true;
			}
		} else if (error instanceof Error) {
			errorString = error.message;
			formatAsPre = false;
		} else if (typeof error === 'object' && 'detail' in error && typeof error.detail === 'string') {
			errorString = error.detail;
			formatAsPre = false;
		} else {
			errorString = JSON.stringify(error, undefined, 2);
			formatAsPre = true;
		}
	}

	export function hide() {
		errorString = '';
	}
</script>

{#if errorString}
	<div class="alert alert-danger alert-dismissible" role="alert">
		{#if formatAsPre}
			<p>There has been an error, reason:</p>
			<pre>{errorString}</pre>
		{:else}
			{errorString}
		{/if}
		<button class="btn-close" data-bs-dismiss="alert" on:click={hide} />
	</div>
{/if}
