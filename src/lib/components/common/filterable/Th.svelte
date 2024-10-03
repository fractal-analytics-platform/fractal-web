<script>
	/** @type {import('@vincjo/datatables').DataHandler} */
	export let handler;
	/** @type {string} */
	export let key;
	/** @type {string} */
	export let label;
	let filterLabel = label;

	/** @type {import('svelte/store').Writable<{ identifier?: string, direction?: 'asc' | 'desc' }>} */
	let sorted;
	$: {
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
	}
</script>

<th on:click={() => handler.sort(key)} style="cursor: pointer">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html filterLabel}
</th>
