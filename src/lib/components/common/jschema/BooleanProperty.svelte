<script>
	import { getContext } from 'svelte';
	import { page } from '$app/stores';
	import PropertyLabel from './PropertyLabel.svelte';

	const schemaManager = getContext('schemaManager');

	/** @type {import('$lib/components/common/jschema/schema_management').SchemaProperty} */
	export let schemaProperty;

	function handleValueChange() {
		schemaManager.updateValue(schemaProperty.key, schemaProperty.value);
	}
</script>

<div class="d-flex align-items-center p-2">
	<div class="property-metadata d-flex flex-row align-self-center w-50">
		<PropertyLabel {schemaProperty} defaultTitle="Boolean argument" tag="span" />
	</div>
	<div class="property-input ms-auto w-25">
		{#if $page.url.pathname.startsWith('/v1')}
			<div class="form-check">
				<input
					id="property-{schemaProperty.key}"
					type="checkbox"
					bind:checked={schemaProperty.value}
					on:change={handleValueChange}
					class="form-check-input"
				/>
				<label class="form-check-label" for="property-{schemaProperty.key}">
					{schemaProperty.value}
				</label>
			</div>
		{:else}
			<div class="form-check form-switch">
				<input
					id="property-{schemaProperty.key}"
					class="form-check-input"
					type="checkbox"
					bind:checked={schemaProperty.value}
					on:change={handleValueChange}
					role="switch"
				/>
			</div>
		{/if}
	</div>
</div>
