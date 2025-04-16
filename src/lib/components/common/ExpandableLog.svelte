<script>
	import { onDestroy, onMount } from 'svelte';

	/** @type {Array<{text: string, highlight: boolean}>} */
	export let logParts = [];
	export let highlight = false;

	/** Show/hide complete stack trace */
	let showDetails = false;

	function expandDetails() {
		showDetails = true;
		restoreModalFocus();
	}

	/**
	 * Restore focus on modal, otherwise it will not be possible to close it using the esc key
	 */
	function restoreModalFocus() {
		const modal = document.querySelector('.modal.show');
		if (modal instanceof HTMLElement) {
			modal.focus();
		}
	}

	onMount(() => {
		restoreModalFocus();
	});

	onDestroy(() => {
		restoreModalFocus();
	});
</script>

<div class="expandable-log">
	<!-- IMPORTANT: do not reindent the pre block, as it will affect the aspect of the log message -->
	{#if logParts.length > 1}
		<pre class="ps-0 pe-0">
<!-- -->{#each logParts as part, i}{#if part.highlight}<div class="ps-3 pe-3 highlight">{part.text}
<!-- --></div>{:else if showDetails || (i + 1 < logParts.length && !logParts[i + 1].highlight)}<div
						class="ps-3 pe-3">{part.text}</div>{:else}<button
						class="btn btn-link text-decoration-none details-btn"
						on:click={expandDetails}>... (details hidden, click here to expand)</button
					>{/if}{/each}</pre>
	{:else}
		<pre class:highlight>{logParts.map((p) => p.text).join('\n')}</pre>
	{/if}
</div>

<style>
	.expandable-log {
		/** avoid issues with overflow of inner divs */
		display: table;
		width: 100%;
	}

	.highlight {
		font-weight: bold;
		background-color: #ffe5e5;
	}

	.details-btn {
		font-family: revert;
	}
</style>
