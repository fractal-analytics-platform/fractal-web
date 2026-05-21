<script>
	import { onMount, tick } from 'svelte';

	/**
	 * @typedef {Object} Props
	 * @property {string} id
	 * @property {object} left
	 * @property {object} right
	 */
	/** @type {Props} */
	let { id, left, right } = $props();

	/**
	 * @param {ShadowRoot} root
	 */
	function addHideSwitchStyle(root) {
		if (!root.querySelector(`style[data-id="hide-switch-style"]`)) {
			const s = document.createElement('style');
			s.setAttribute('data-id', 'hide-switch-style');
			s.textContent = `label.switch{display:none !important;}`;
			root.prepend(s);
		}
	}

	onMount(async () => {
		await tick();
		const parent = document.getElementById(id);
		if (parent instanceof HTMLElement && parent.shadowRoot) {
			const showOnlyChanged = parent.shadowRoot.querySelector('[data-action="filter"]');
			if (showOnlyChanged instanceof HTMLInputElement) {
				// show the whole JSON
				showOnlyChanged.click();
				// hide switch
				addHideSwitchStyle(parent.shadowRoot);
				const mo = new MutationObserver(() => {
					// Re-insert if removed or shadow DOM rebuilt
					addHideSwitchStyle(/** @type {ShadowRoot} */ (parent.shadowRoot));
				});
				mo.observe(parent.shadowRoot, { childList: true, subtree: true });
			}
		}
	});
</script>

<json-diff-viewer {left} {right} {id} test-id={id}></json-diff-viewer>

<style>
	/** light theme */
	json-diff-viewer {
		--add: #15803d;
		--rem: #b91c1c;
		--mod: #ca8a04;
		--bg: #f4f4f4;
		--bg2: #f9fafb;
		--bdr: #d1d5db;
		--txt: #030712;
		--dim: #4b5563;
		--slider: #d1d5db;
		--key: #075985;
		--str: #6d28d9;
		--num: #047857;
		--bool: #b45309;
		--nul: #a21caf;
		--br: #6b7280;
	}
</style>
