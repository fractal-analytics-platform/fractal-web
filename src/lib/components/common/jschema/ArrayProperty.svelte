<script>
	import { onMount } from 'svelte';
	import PropertyDiscriminator from '$lib/components/common/jschema/PropertyDiscriminator.svelte';

	export let schemaProperty = undefined;
	let nestedProperties = [];


	onMount(() => {
		schemaProperty.value?.forEach((nestedValue, index) => {
			schemaProperty.addNestedSchemaProperty(nestedValue, index);
		});
		nestedProperties = schemaProperty.nestedProperties;
	});

	function addNestedProperty() {
		schemaProperty.addNestedSchemaProperty(undefined, nestedProperties.length);
		nestedProperties = schemaProperty.nestedProperties;
	}

	function removeNestedProperty(index) {
		schemaProperty.removeNestedSchemaProperty(index);
		nestedProperties = schemaProperty.nestedProperties;
	}

</script>

{#if schemaProperty }
  <div style='background-color: rosybrown' class='d-flex flex-column p-2'>
    <div class='property-metadata d-flex flex-column w-50'>
      <span class='fs-4 {schemaProperty.isRequired() ? "fw-bold" : ""}'>{ schemaProperty.title }</span>
      <span>{ schemaProperty.description }</span>
    </div>
    <div class='array-items my-2'>
      <div class='d-flex justify-content-center'>
        <button class='btn btn-primary' on:click={addNestedProperty}>Add argument to list</button>
      </div>
      <div>
        {#each nestedProperties as nestedProperty, index (nestedProperty.key)}
          <div>
            <button class='btn btn-warning' on:click={removeNestedProperty(index)}>Remove</button>
            <PropertyDiscriminator schemaProperty={nestedProperty} />
          </div>
        {/each}
      </div>
    </div>
  </div>

{:else}

  <div>
    <p>Unable to display array data</p>
  </div>


{/if}