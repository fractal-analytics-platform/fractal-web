<script>
	import { run } from 'svelte/legacy';

	
	
	
	/**
	 * @typedef {Object} Props
	 * @property {import('@vincjo/datatables').DataHandler} handler
	 * @property {string} key
	 * @property {string} label
	 */

	/** @type {Props} */
	let { handler, key, label } = $props();
	let filterLabel = $state(label);

	/** @type {import('svelte/store').Writable<{ identifier?: string, direction?: 'asc' | 'desc' }>} */
	let sorted = $state();
	run(() => {
		sorted = handler.getSort();
		if ($sorted.identifier === key) {
			if ($sorted.direction === 'asc') {
				filterLabel = label + '&nbsp;↑';
			} else {
				filterLabel = label + '&nbsp;↓';
			}
		} else {
			filterLabel = label + '&nbsp;⇅';
		}
	});
</script>

<th onclick={() => handler.sort(key)} style="cursor: pointer">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html filterLabel}
</th>
