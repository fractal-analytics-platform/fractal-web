<script>
	/** @type {import('@vincjo/datatables').DataHandler} */
	export let handler;
	/** @type {string} */
	export let key;
	/** @type {string} */
	export let label;
	let filterLabel = label;

	/** @type {import('svelte/store').Writable<{ identifier: string | null, direction: 'asc' | 'desc' | null }>} */
	let sorted;
	$: {
		sorted = handler.getSorted();
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

<th on:click={() => handler.sort(key)} style="cursor: pointer">{@html filterLabel}</th>
