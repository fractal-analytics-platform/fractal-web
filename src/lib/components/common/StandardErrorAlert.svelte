<script>
	import { AlertError } from '$lib/common/errors';

	export let error = undefined;

	/** @type {string | undefined} */
	$: errorString = JSON.stringify(getErrorValue(), undefined, 2);

	function getErrorValue() {
		if (error instanceof AlertError) {
			return error.reason;
		} else if (error instanceof Error) {
			return error.message;
		}
		return error;
	}

	export function hide() {
		errorString = undefined
	}
</script>

{#if errorString}
	<div class="alert alert-danger alert-dismissible">
		<pre>There has been an error, reason:</pre>
		<pre>{errorString}</pre>
		<button class="btn-close" data-bs-dismiss="alert" on:click={hide} />
	</div>
{/if}
