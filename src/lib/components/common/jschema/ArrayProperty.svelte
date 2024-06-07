<script>
	import { onMount } from 'svelte';
	import PropertyDiscriminator from '$lib/components/common/jschema/PropertyDiscriminator.svelte';
	import PropertyDescription from '$lib/components/common/jschema/PropertyDescription.svelte';

	/** @type {import('$lib/components/common/jschema/schema_management').SchemaProperty} */
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

	function addNestedProperty(value = undefined) {
		if (!canAddMoreItems(nestedProperties)) {
			return;
		}
		schemaProperty.addNestedSchemaProperty(value, nestedProperties.length);
		nestedProperties = schemaProperty.nestedProperties;
	}

	/**
	 * @param {number} index
	 */
	function removeNestedProperty(index) {
		schemaProperty.removeNestedSchemaProperty(index);
		nestedProperties = schemaProperty.nestedProperties;
	}

	/**
	 * @param {number} index
	 */
	function clearNestedProperty(index) {
		schemaProperty.updateNestedPropertyValue(undefined, index);
		nestedProperties = schemaProperty.nestedProperties;
	}

	/**
	 * @param {number} index
	 */
	function moveUp(index) {
		nestedProperties = schemaProperty.moveNestedPropertyUp(index);
	}

	/**
	 * @param {number} index
	 */
	function moveDown(index) {
		nestedProperties = schemaProperty.moveNestedPropertyDown(index);
	}

	/**
	 * @param {any[]} nestedProperties
	 */
	function canAddMoreItems(nestedProperties) {
		const maxItems = getMaxItems(schemaProperty.referenceSchema);
		return maxItems === null || nestedProperties.length < maxItems;
	}

	/**
	 * @param {import('$lib/components/common/jschema/schema_management').SchemaProperty} schemaProperty
	 * @returns {boolean} true if has fixed length (minItems === maxItems), false otherwise
	 */
	function isTuple(schemaProperty) {
		const minItems = getMinItems(schemaProperty.referenceSchema);
		const maxItems = getMaxItems(schemaProperty.referenceSchema);
		return minItems !== null && maxItems !== null && minItems === maxItems;
	}

	/**
	 * @param {import('$lib/components/common/jschema/schema_management').SchemaProperty} schemaProperty
	 * @returns {boolean} true if the nested properties can be removed, false otherwise
	 */
	function showRemoveButton(schemaProperty) {
		if (isTuple(schemaProperty)) {
			return false;
		}
		if (!schemaProperty.isRequired()) {
			return true;
		}
		const minItems = getMinItems(schemaProperty.referenceSchema);
		if (minItems === null) {
			return true;
		}
		return nestedProperties.length > minItems;
	}

	$: addNestedPropertyBtnDisabled = !canAddMoreItems(nestedProperties);

	function addTuple() {
		const minItems = /** @type {number} */ (getMinItems(schemaProperty.referenceSchema));
		if (
			!Array.isArray(schemaProperty.defaultValue) ||
			schemaProperty.defaultValue.length !== minItems
		) {
			for (let i = 0; i < minItems; i++) {
				addNestedProperty();
			}
		} else {
			for (let i = 0; i < schemaProperty.defaultValue.length; i++) {
				addNestedProperty(JSON.parse(JSON.stringify(schemaProperty.defaultValue[i])));
			}
		}
	}

	function removeTuple() {
		const count = nestedProperties.length;
		for (let i = 0; i < count; i++) {
			removeNestedProperty(0);
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
								{#if !isTuple(schemaProperty)}
									<button
										class="btn btn-primary"
										type="button"
										on:click={() => addNestedProperty()}
										disabled={addNestedPropertyBtnDisabled}
									>
										Add argument to list
									</button>
								{:else if !schemaProperty.isRequired()}
									{#if nestedProperties.length > 0}
										<button class="btn btn-primary" type="button" on:click={removeTuple}>
											Remove tuple
										</button>
									{:else}
										<button class="btn btn-primary" type="button" on:click={addTuple}>
											Add tuple
										</button>
									{/if}
								{/if}
							</div>
							<div>
								{#each nestedProperties as nestedProperty, index (nestedProperty.key)}
									<div class="d-flex">
										<div class="align-self-center m-2">
											{#key nestedProperties.length}
												{#if showRemoveButton(schemaProperty)}
													<button
														class="btn btn-warning"
														type="button"
														on:click={() => removeNestedProperty(index)}
													>
														Remove
													</button>
												{:else}
													<button
														class="btn btn-warning"
														type="button"
														on:click={() => clearNestedProperty(index)}
													>
														Clear
													</button>
												{/if}
											{/key}
										</div>
										<div class="flex-fill">
											<PropertyDiscriminator schemaProperty={nestedProperty} />
										</div>
										<div class="align-self-right mt-2 me-2">
											{#if nestedProperties.length > 1 && !isTuple(schemaProperty)}
												<button
													class="btn btn-light"
													on:click|preventDefault={() => moveUp(index)}
													aria-label="Move item up"
													disabled={index === 0}
												>
													<i class="bi-arrow-up" />
												</button>
												<button
													class="btn btn-light"
													on:click|preventDefault={() => moveDown(index)}
													aria-label="Move item down"
													disabled={index === nestedProperties.length - 1}
												>
													<i class="bi-arrow-down" />
												</button>
											{/if}
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
