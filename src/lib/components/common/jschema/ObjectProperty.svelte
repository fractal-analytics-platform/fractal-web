<script>
	import { onMount } from 'svelte';
	import PropertiesBlock from '$lib/components/common/jschema/PropertiesBlock.svelte';
	import PropertyLabel from './PropertyLabel.svelte';

	/** @type {import('$lib/components/common/jschema/schema_management').SchemaProperty} */
	export let objectSchema;

	let customObjectPropertyKey = undefined;
	/** @type {string | undefined} */
	let addNestedObjectError = undefined;

	let accordionParentKey = objectSchema.key.replaceAll('#', '');
	let collapseSymbol = accordionParentKey + '-collapse';

	onMount(() => {
		if (objectSchema.hasCustomKeyValues) {
			const keys = Object.keys(objectSchema.value);
			keys.forEach((key) => {
				objectSchema.addProperty(key, objectSchema.value[key], false);
			});
			objectSchema = objectSchema;
		}
	});

	function addNestedObjectProperty() {
		try {
			addNestedObjectError = undefined;
			objectSchema.addProperty(customObjectPropertyKey, undefined, true);
			customObjectPropertyKey = '';
			objectSchema = objectSchema;
		} catch (e) {
			const msg = /** @type {Error} */ (e).message;
			console.error(msg);
			addNestedObjectError = msg;
		}
	}
</script>

{#if objectSchema}
	<div class="d-flex flex-column p-2">
		<div class="object-properties my-2">
			<div class="accordion" id={accordionParentKey}>
				<div class="accordion-item">
					<div class="accordion-header">
						<button
							class="accordion-button"
							class:collapsed={!objectSchema.isRequired()}
							type="button"
							data-bs-toggle="collapse"
							data-bs-target="#{collapseSymbol}"
						>
							<PropertyLabel schemaProperty={objectSchema} tag="span" />
						</button>
					</div>
					<div
						id={collapseSymbol}
						class="accordion-collapse"
						class:collapse={!objectSchema.isRequired()}
						class:show={objectSchema.isRequired()}
						data-bs-parent="#{accordionParentKey}"
					>
						<div class="accordion-body p-1">
							{#if objectSchema.hasCustomKeyValues}
								<div class="d-flex justify-content-center">
									<form class="row row-cols-auto g-3 align-items-center p-2 flex-grow-1">
										<div class="col-lg-6 offset-lg-3 mb-1">
											<div class="input-group" class:has-validation={addNestedObjectError}>
												<input
													type="text"
													bind:value={customObjectPropertyKey}
													placeholder="Key"
													class="form-control"
													class:is-invalid={addNestedObjectError}
												/>
												<button
													class="btn btn-primary"
													type="button"
													on:click={addNestedObjectProperty}
												>
													Add property
												</button>
												{#if addNestedObjectError}
													<div class="invalid-feedback">{addNestedObjectError}</div>
												{/if}
											</div>
										</div>
									</form>
								</div>
								{#if objectSchema.properties}
									{#key objectSchema.properties}
										<PropertiesBlock
											blockKey={objectSchema.key}
											properties={objectSchema.properties}
											required={objectSchema.requiredProperties}
											removePropertyBlock={(propertyKey) => {
												propertyKey = propertyKey.split(objectSchema.manager.keySeparator).pop();
												objectSchema.removeProperty(propertyKey);
												objectSchema = objectSchema;
											}}
										/>
									{/key}
								{/if}
							{:else if objectSchema.properties}
								{#key objectSchema.properties}
									<PropertiesBlock
										blockKey={objectSchema.key}
										properties={objectSchema.properties}
										required={objectSchema.requiredProperties}
									/>
								{/key}
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div>
		<p>Object schema is undefined</p>
	</div>
{/if}
