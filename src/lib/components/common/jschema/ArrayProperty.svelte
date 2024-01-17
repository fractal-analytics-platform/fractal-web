<script>
	import { onMount } from 'svelte';
	import PropertyDiscriminator from '$lib/components/common/jschema/PropertyDiscriminator.svelte';
	import PropertyDescription from '$lib/components/common/jschema/PropertyDescription.svelte';

	export let schemaProperty;
	let nestedProperties = [];

	let accordionParentKey = schemaProperty.key.replaceAll('#', '');
	let collapseSymbol = accordionParentKey + '-collapse';

	onMount(() => {
		let count = 0;
		if (Array.isArray(schemaProperty.value)) {
			schemaProperty.value.forEach(
				(/** @type {any} */ nestedValue, /** @type {number} */ index) => {
					schemaProperty.addNestedSchemaProperty(nestedValue, index);
				}
			);
			count = schemaProperty.value.length;
		}
		// Create mandatory fields in case of minItems
		if (schemaProperty.isRequired()) {
			const minItems = getMinItems(schemaProperty.referenceSchema);
			if (minItems !== null) {
				for (let i = count; i < minItems; i++) {
					addNestedProperty();
				}
			}
		}
		nestedProperties = schemaProperty.nestedProperties;
	});

	/**
	 * @param {object} referenceSchema
	 * @returns {number|null}
	 */
	function getMinItems(referenceSchema) {
		if ('minItems' in referenceSchema) {
			return /** @type {number} */ (referenceSchema.minItems);
		}
		return null;
	}

	/**
	 * @param {object} referenceSchema
	 * @returns {number|null}
	 */
	function getMaxItems(referenceSchema) {
		if ('maxItems' in referenceSchema) {
			return /** @type {number} */ (referenceSchema.maxItems);
		}
		return null;
	}

	function addNestedProperty() {
		const maxItems = getMaxItems(schemaProperty.referenceSchema);
		if (maxItems !== null && nestedProperties.length === maxItems) {
			// It is not possible to add more properties than maxItems
			return;
		}
		schemaProperty.addNestedSchemaProperty(undefined, nestedProperties.length);
		nestedProperties = schemaProperty.nestedProperties;
	}

	function removeNestedProperty(/** @type {number} */ index) {
		schemaProperty.removeNestedSchemaProperty(index);
		nestedProperties = schemaProperty.nestedProperties;
		const minItems = getMinItems(schemaProperty.referenceSchema);
		if (schemaProperty.isRequired() && minItems !== null && nestedProperties.length < minItems) {
			schemaProperty.addNestedSchemaProperty(undefined, index);
			nestedProperties = schemaProperty.nestedProperties;
		}
	}
</script>

{#if schemaProperty}
	<div class="d-flex flex-column p-2">
		<div class="array-items my-2">
			<div class="accordion" id={accordionParentKey}>
				<div class="accordion-item">
					<div class="accordion-header">
						<button
							class="accordion-button"
							class:collapsed={!schemaProperty.isRequired()}
							type="button"
							data-bs-toggle="collapse"
							data-bs-target="#{collapseSymbol}"
						>
							<span class={schemaProperty.isRequired() ? 'fw-bold' : ''}>
								{schemaProperty.title || ''}
							</span>
							<PropertyDescription description={schemaProperty.description} />
						</button>
					</div>
					<div
						id={collapseSymbol}
						class="accordion-collapse"
						class:collapse={!schemaProperty.isRequired()}
						class:show={schemaProperty.isRequired()}
						data-bs-parent="#{accordionParentKey}"
					>
						<div class="accordion-body p-1">
							<div class="d-flex justify-content-center p-2">
								<button class="btn btn-primary" type="button" on:click={addNestedProperty}>
									Add argument to list
								</button>
							</div>
							<div>
								{#each nestedProperties as nestedProperty, index (nestedProperty.key)}
									<div class="d-flex">
										<div class="align-self-center m-2">
											<button
												class="btn btn-warning"
												type="button"
												on:click={() => removeNestedProperty(index)}
											>
												Remove
											</button>
										</div>
										<div class="flex-fill">
											<PropertyDiscriminator schemaProperty={nestedProperty} />
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div>
		<p>Unable to display array data</p>
	</div>
{/if}
