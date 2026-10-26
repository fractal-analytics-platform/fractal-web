<script>
	import { buildHelpLink } from '#lib/common/component_utilities.js';
	import { currentHelpLink } from '#lib/stores.js';

	/**
	 * @typedef {Object} Props
	 * @property {string} url
	 */

	/** @type {Props} */
	let { url } = $props();
</script>

{#if buildHelpLink(url)}
	<button
		class="btn btn-link ms-2"
		aria-label="Help page"
		onclick={() => currentHelpLink.set(buildHelpLink(url))}
	>
		<i class="bi bi-question-circle"></i>
	</button>
{/if}
