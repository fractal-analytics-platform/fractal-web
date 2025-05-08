<script>
	import { AlertError, extractErrorDetail } from '$lib/common/errors';

	/**
	 * @typedef {Object} Props
	 * @property {any} [error]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { error, children } = $props();

	const errorData = $derived(getErrorData(error));

	/**
	 * @param {any} error
	 * @returns {{ errorString: string, formatAsPre: boolean }}
	 */
	function getErrorData(error) {
		if (error === undefined) {
			return {
				errorString: '',
				formatAsPre: false
			};
		}
		if (error instanceof AlertError) {
			const simpleMessage = error.getSimpleValidationMessage();
			const errorDetail = extractErrorDetail(error.reason);
			if (simpleMessage) {
				return {
					errorString: simpleMessage,
					formatAsPre: false
				};
			} else if (typeof error.reason === 'string') {
				return {
					errorString: error.reason,
					formatAsPre: false
				};
			} else if (typeof errorDetail === 'string') {
				return {
					errorString: errorDetail,
					formatAsPre: false
				};
			} else {
				return {
					errorString: JSON.stringify(error.reason, undefined, 2),
					formatAsPre: true
				};
			}
		} else if (error instanceof Error) {
			return {
				errorString: error.message,
				formatAsPre: false
			};
		} else if (typeof error === 'object' && typeof extractErrorDetail(error) === 'string') {
			return {
				errorString: extractErrorDetail(error),
				formatAsPre: false
			};
		} else {
			return {
				errorString: JSON.stringify(error, undefined, 2),
				formatAsPre: true
			};
		}
	}

	export function hide() {
		error = undefined;
	}
</script>

{#if errorData.errorString}
	<div class="alert alert-danger alert-dismissible" role="alert">
		{@render children?.()}
		{#if errorData.formatAsPre}
			<p>There has been an error, reason:</p>
			<pre>{errorData.errorString}</pre>
		{:else}
			{#each errorData.errorString.split('\n') as line, index}
				{#if index > 0}
					<br />
				{/if}
				{line}
			{/each}
		{/if}
		<button class="btn-close" data-bs-dismiss="alert" aria-label="Close" onclick={hide}></button>
	</div>
{/if}
