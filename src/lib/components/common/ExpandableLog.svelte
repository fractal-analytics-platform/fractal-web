<script>
	/**
	 * @typedef {Object} Props
	 * @property {Array<{text: string, highlight: boolean}>} [logParts]
	 * @property {boolean} [highlight]
	 */

	/** @type {Props} */
	let { logParts = $bindable([]), highlight = false } = $props();

	/** Show/hide complete stack trace */
	let showDetails = $state(false);

	/**
	 * @param {string} line
	 */
	function isWarningLine(line) {
		return line.toLowerCase().includes('warning');
	}

	/**
	 * @param {string} text
	 */
	function splitLines(text) {
		return text.split('\n');
	}
</script>

<div class="expandable-log">
	<!-- IMPORTANT: do not reindent the pre block, as it will affect the aspect of the log message -->
	{#if logParts.length > 1}
		<pre class="ps-0 pe-0">
<!-- -->{#each logParts as part, i (i)}{#if part.highlight}<div
						class="ps-3 pe-3 highlight">{part.text}
<!-- --></div>{:else if showDetails || (i + 1 < logParts.length && !logParts[i + 1].highlight)}{#each splitLines(part.text) as line, i (i)}<div
							class="ps-3 pe-3"
							class:warning-highlight={isWarningLine(line)}>{line}</div>{/each}{:else}<button
						class="btn btn-link text-decoration-none details-btn"
						onclick={() => (showDetails = true)}>... (details hidden, click here to expand)</button
					>{/if}{/each}</pre>
	{:else}
		<pre class:highlight>
<!-- -->{#each splitLines(logParts.map((p) => p.text).join('\n')) as line, i (i)}<div
					class="ps-3 pe-3"
					class:warning-highlight={isWarningLine(line)}>{line}</div>{/each}</pre>
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

	.warning-highlight {
		background-color: #fff3cd;
	}
</style>
