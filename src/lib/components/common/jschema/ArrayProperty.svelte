<script>
	import { onMount } from 'svelte';
	import PropertyDiscriminator from '$lib/components/common/jschema/PropertyDiscriminator.svelte';
	import PropertyDescription from '$lib/components/common/jschema/PropertyDescription.svelte';

	export let schemaProperty;
	let nestedProperties = [];

	let accordionParentKey = schemaProperty.key.replaceAll('#', '');
	let collapseSymbol = accordionParentKey + '-collapse';

	onMount(() => {
		schemaProperty.value?.forEach((/** @type {any} */ nestedValue, /** @type {number} */ index) => {
			schemaProperty.addNestedSchemaProperty(nestedValue, index);
		});
		nestedProperties = schemaProperty.nestedProperties;
	});

	function addNestedProperty() {
		schemaProperty.addNestedSchemaProperty(undefined, nestedProperties.length);
		nestedProperties = schemaProperty.nestedProperties;
	}

	function removeNestedProperty(/** @type {number} */ index) {
		schemaProperty.removeNestedSchemaProperty(index);
		nestedProperties = schemaProperty.nestedProperties;
	}
</script>

{#if schemaProperty}
	<div class="d-flex flex-column p-2">
		<div class="property-metadata d-flex flex-row w-100">
			<span class={schemaProperty.isRequired() ? 'fw-bold' : ''}>{schemaProperty.title || ''}</span>
			<PropertyDescription description={schemaProperty.description} />
		</div>
		<div class="array-items my-2">
			<div class="accordion" id={accordionParentKey}>
				<div class="accordion-item">
					<div class="accordion-header">
						<button
							class="accordion-button collapsed"
							type="button"
							data-bs-toggle="collapse"
							data-bs-target="#{collapseSymbol}"
						>
							Arguments list
						</button>
					</div>
					<div
						id={collapseSymbol}
						class="accordion-collapse collapse"
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
