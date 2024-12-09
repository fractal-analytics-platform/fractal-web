<script>
	import { onMount } from 'svelte';

	export let description = undefined;
	export let html = false;

	/** @type {HTMLElement|undefined} */
	let element;

	let popover;
	let windowEventListener;

	onMount(() => {
		if (element) {
			element.addEventListener('click', function () {
				// @ts-ignore
				// eslint-disable-next-line no-undef
				popover = bootstrap.Popover.getOrCreateInstance(element, { trigger: 'manual' });
				popover.toggle();
				if (!windowEventListener) {
					windowEventListener = function (/** @type {MouseEvent} */ event) {
						const eventPath = event.composedPath();
						if (
							eventPath.length > 0 &&
							eventPath[0] instanceof HTMLElement &&
							eventPath[0] !== element
						) {
							const clickedPopover = eventPath[0].closest('.popover');
							if (!clickedPopover) {
								popover?.hide();
								popover = undefined;
								window.removeEventListener('click', windowEventListener);
								windowEventListener = undefined;
							}
						}
					};
					window.addEventListener('click', windowEventListener);
				}
			});
		}
	});
</script>

<span class="ms-2 property-description">
	{#if description}
		<span
			bind:this={element}
			tabindex="0"
			role="button"
			data-bs-trigger="focus"
			class="bi bi-info-circle text-primary"
			data-bs-toggle="collapse"
			data-bs-target
			data-bs-html={html}
			data-bs-content={description}
		/>
	{/if}
</span>
