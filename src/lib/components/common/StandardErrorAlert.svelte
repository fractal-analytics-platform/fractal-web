<script>
	import { AlertError, extractErrorDetail } from '$lib/common/errors';

	/**
	 * @typedef {Object} Props
	 * @property {any} [error]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { error, children = undefined } = $props();

	const errorData = $derived(getErrorData(error));

	/**
	 * @param {any} error
	 * @returns {string | object}
	 */
	function getErrorData(error) {
		if (error === undefined) {
			return '';
		}
		if (error instanceof AlertError) {
			return error.errorData;
		} else if (error instanceof Error) {
			return error.message;
		} else {
			return extractErrorDetail(error) || error;
		}
	}

	export const hide = () => {
		error = undefined;
	};
</script>

{#if errorData}
	<div class="alert alert-danger alert-dismissible" role="alert">
		{@render children?.()}
		{#if typeof errorData === 'string'}
			{#each errorData.split('\n') as line, index (index)}
				{#if index > 0}
					<br />
				{/if}
				{line}
			{/each}
		{:else}
			<p>There has been an error, reason:</p>
			<pre>{JSON.stringify(errorData, undefined, 2)}</pre>
		{/if}
		<button class="btn-close" data-bs-dismiss="alert" aria-label="Close" onclick={hide}></button>
	</div>
{/if}
