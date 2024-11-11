<script>
	import { AlertError, extractErrorDetail } from '$lib/common/errors';

	export let error = undefined;

	let errorString = '';
	let formatAsPre = false;

	$: if (error) {
		updateErrorMessage();
	}

	function updateErrorMessage() {
		if (error instanceof AlertError) {
			const simpleMessage = error.getSimpleValidationMessage();
			const errorDetail = extractErrorDetail(error.reason);
			if (simpleMessage) {
				errorString = simpleMessage;
				formatAsPre = false;
			} else if (typeof error.reason === 'string') {
				errorString = error.reason;
				formatAsPre = false;
			} else if (typeof errorDetail === 'string') {
				errorString = errorDetail;
				formatAsPre = false;
			} else {
				errorString = JSON.stringify(error.reason, undefined, 2);
				formatAsPre = true;
			}
		} else if (error instanceof Error) {
			errorString = error.message;
			formatAsPre = false;
		} else if (typeof error === 'object' && typeof extractErrorDetail(error) === 'string') {
			errorString = extractErrorDetail(error);
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
		<slot />
		{#if formatAsPre}
			<p>There has been an error, reason:</p>
			<pre>{errorString}</pre>
		{:else}
			{#each errorString.split('\n') as line, index}
				{#if index > 0}
					<br />
				{/if}
				{line}
			{/each}
		{/if}
		<button class="btn-close" data-bs-dismiss="alert" on:click={hide} />
	</div>
{/if}
