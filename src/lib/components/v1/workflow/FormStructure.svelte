<script>
	// This component is responsible to build the infrastructure of a form
	// Basically, given a property (entry) in input, based on its kind, this component will build a structure of
	// subcomponents that will manipulate the entry
	import { createEventDispatcher } from 'svelte';
	import FormBaseEntry from './FormBaseEntry.svelte';
	import NewEntryProperty from './NewEntryProperty.svelte';

	const dispatcher = createEventDispatcher();

	export let entry;
	export let entryName = undefined;
	export let entryId = undefined;
	export let isListEntry = false;
	export let entryIndex = undefined;
	// Set a random guid to the entry
	let entryEscapedName = 'entry-' + entryName;
	// Generate a random string

	// TODO: This is a temporary solution to the problem of having multiple entries with the same name
	if (entryId === undefined) {
		entryId = entryName + '-' + Date.now().toString();
	}

	let entryType = typeof entry;
	let isArray = Array.isArray(entry);

	// Set default entry value to an empty object if none is provided
	if (entry == null || entry === undefined) {
		entry = {};
	}

	function handleEntryUpdate(event) {
		const updatedEntryName = event.detail.name;
		const updatedValue = event.detail.value;
		if (entryType === 'object' && !isArray) {
			// Do something with this kind of entry
			// The entry managed by this component is an object.
			// Within the event.detail there is the updated value set by the user.
			entry[updatedEntryName] = updatedValue;
			dispatcher('entryUpdated', {
				name: entryName,
				type: entryType,
				value: entry
			});
			// The following code is probably not needed.
			// It will be left here for reference.
		} else if (isArray) {
			// The entry is an array. I received an updated object of that array.
			// I know the name property of such object
			// I could map thorugh the whole array and update the element value that matches with name

			// Update the entry
			// It could also be possible that entries passed through lists are modified by reference and not by value
			// The following could be optional then
			// entry[event.detail.index] = updatedValue

			// The following is required when a list item is not an object.
			// In such case we have to intercept the value and update the entry, which is a list.
			if (event.detail.listEntry) {
				entry[event.detail.index] = event.detail.value;
			}

			dispatcher('entryUpdated', {
				name: entryName,
				type: entryType,
				value: entry
			});
		} else {
			dispatcher('entryUpdated', {
				name: entryName,
				type: event.detail.type,
				value: event.detail.value,
				listEntry: event.detail.listEntry,
				index: event.detail.index
			});
		}
	}

	function newEntryInserted(newEntry) {
		entry = newEntry;
		dispatchEntryInserted();
	}

	function handleNewEntryInserted() {
		dispatchEntryInserted();
	}

	function dispatchEntryInserted() {
		dispatcher('entryInserted', entry);
	}
</script>

<div class="mb-2">
	{#if entryType === 'object' && !isArray}
		<!-- If a entryName is set, then this is a nested-entry -->
		<!-- Should build an accordion -->
		{#if entryName}
			<div class="accordion">
				<div class="accordion-item">
					<div class="accordion-header">
						<button
							class="accordion-button collapsed"
							type="button"
							data-bs-toggle="collapse"
							data-bs-target="#{entryEscapedName}"
						>
							{!isListEntry ? entryName : ''} (obj)
						</button>
					</div>
					<div id={entryEscapedName} class="accordion-collapse collapse">
						<div class="accordion-body p-2">
							{#each Object.entries(entry) as [key, value]}
								<svelte:self
									entry={value}
									entryName={key}
									on:entryUpdated={handleEntryUpdate}
									on:entryInserted={handleNewEntryInserted}
								/>
							{/each}
							<NewEntryProperty {entry} submitNewEntry={newEntryInserted} />
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- Should build a sequence of components that will enable the editing of each object properties -->
			{#if entry}
				{#each Object.entries(entry) as [key, value]}
					<svelte:self
						entry={value}
						entryName={key}
						on:entryUpdated={handleEntryUpdate}
						on:entryInserted={handleNewEntryInserted}
					/>
				{/each}
			{/if}
		{/if}
	{/if}

	{#if isArray}
		<!-- Should build an accordion, but one for each element in the list -->
		<!-- Each element in the list is an object! -->
		{#if entryName}
			<div class="accordion">
				<div class="accordion-item">
					<div class="accordion-header">
						<button
							class="accordion-button collapsed"
							type="button"
							data-bs-toggle="collapse"
							data-bs-target="#{entryEscapedName}"
						>
							{!isListEntry ? entryName : ''} (list)
						</button>
					</div>
					<div id={entryEscapedName} class="accordion-collapse collapse">
						<div class="accordion-body p-2">
							{#each entry as listItem, index}
								<svelte:self
									isListEntry={true}
									entry={listItem}
									entryIndex={index}
									entryId={entryName + '-' + index + '-' + 'list-item'}
									entryName={entryName + '-' + index + '-' + 'list-item'}
									on:entryUpdated={handleEntryUpdate}
									on:entryInserted={handleNewEntryInserted}
								/>
							{/each}
							<NewEntryProperty {entry} submitNewEntry={newEntryInserted} isListItem={true} />
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/if}

	{#if entryType !== 'object'}
		<!-- If it is neither an object, nor a list, just display base entry components -->
		{#if entryName}
			<FormBaseEntry
				listEntryIndex={entryIndex}
				{isListEntry}
				{entryName}
				entryValue={entry}
				on:entryUpdated={handleEntryUpdate}
			/>
		{/if}
	{/if}
</div>
