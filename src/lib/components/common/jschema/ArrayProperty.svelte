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

  <div style='background-color: rosybrown'>
    <p>Array property</p>
    <button class='btn btn-primary' on:click={addNestedProperty}>Add</button>

    {#each nestedProperties as nestedProperty, index (nestedProperty.key)}
      <div>
        <button class='btn btn-warning' on:click={removeNestedProperty(index)}>Remove</button>
        <PropertyDiscriminator schemaProperty={nestedProperty} />
      </div>
    {/each}

  </div>

{:else}

  <div>
    <p>Unable to display array data</p>
  </div>


{/if}