<script>
	import { compute_rest_props } from 'svelte/internal';
	import FormStructure from './FormStructure.svelte';
	import NewEntryProperty from './NewEntryProperty.svelte';

	export let entry;

	console.log("I AM IN FormBuilder")

	if (entry == null || entry === undefined) {
		entry = {};
	}

	const submitNewEntry = (newEntry) => {
		updateEntry(newEntry);
	};

	export let updateEntry;

	function handleEntryUpdateEvent(event) {
		updateEntry(event.detail.value);
	}

	function handleEntryInserted(event) {
		updateEntry(event.detail);
	}
</script>

<div>
	<FormStructure
		{entry}
		on:entryUpdated={handleEntryUpdateEvent}
		on:entryInserted={handleEntryInserted}
	/>
	<NewEntryProperty {entry} {submitNewEntry} />
</div>
