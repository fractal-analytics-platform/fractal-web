<script>
	import { onDestroy, onMount } from 'svelte';

	/** @type {string} */
	export let id;
	/** @type {string} */
	export let title;

	export let placement = 'top';

	let tooltip;

	/**
	 * @param {boolean} enabled
	 */
	export function setEnabled(enabled) {
		if (!tooltip) {
			return;
		}
		if (enabled) {
			tooltip.enable();
		} else {
			tooltip.disable();
		}
	}

	onMount(() => {
		const element = document.getElementById(id);
		if (!element) {
			console.warn(`Unable to find element for id ${id}`);
			return;
		}
		// @ts-expect-error
		// eslint-disable-next-line no-undef
		tooltip = new bootstrap.Tooltip(element, { title });
	});

	onDestroy(() => {
		tooltip?.dispose();
		tooltip = undefined;
	});
</script>

<span {id} data-bs-placement={placement} style="display: inline-block;">
	<slot />
</span>
