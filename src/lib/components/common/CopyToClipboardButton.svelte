<script>
	import { hideAllTooltips } from '$lib/common/component_utilities';
	import { onDestroy } from 'svelte';

	/** @type {string} */
	export let clipboardText;
	/** @type {string} */
	export let text;
	/** @type {string} */
	export let id;
	export let btnClass = 'primary';

	let copied = false;
	let tooltip;

	let timeout = undefined;

	async function copyTextToClipboard() {
		await navigator.clipboard.writeText(clipboardText);
		copied = true;

		hideAllTooltips();
		// @ts-expect-error
		// eslint-disable-next-line no-undef
		tooltip = new bootstrap.Tooltip(document.getElementById(id), {
			title: 'Copied!',
			trigger: 'manual'
		});
		tooltip.show();
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			copied = false;
			tooltip?.dispose();
			tooltip = undefined;
		}, 2000);
	}

	export function reset() {
		tooltip?.dispose();
		tooltip = undefined;
		copied = false;
	}

	onDestroy(() => {
		clearTimeout(timeout);
	});
</script>

<button class="btn btn-{btnClass} copy-to-clipboard-btn" on:click={copyTextToClipboard} {id}>
	{#if copied}
		<i class="bi bi-clipboard-check" />
	{:else}
		<i class="bi bi-clipboard" />
	{/if}
	{text}
</button>
