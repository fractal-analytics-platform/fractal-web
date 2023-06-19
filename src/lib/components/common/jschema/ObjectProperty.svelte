<script>
	import PropertiesBlock from '$lib/components/common/jschema/PropertiesBlock.svelte';

	export let objectSchema = undefined;

	let customObjectPropertyKey = undefined;
	let addNestedObjectError = undefined;

	function addNestedObjectProperty() {
		try {
			objectSchema.addProperty(customObjectPropertyKey);
			customObjectPropertyKey = '';
			objectSchema = objectSchema;
		} catch (e) {
			console.error(e.message);
			addNestedObjectError = e;
		}
	}

</script>

{#if objectSchema}
  <div style='background-color: #9e9e9e'>
    <p>Object property</p>

    {#if objectSchema.hasCustomKeyValues}
      <p>Custom key values</p>
      <form action=''>
        <input type='text' bind:value={customObjectPropertyKey} placeholder='Key'>
        <button on:click={addNestedObjectProperty}>Add property</button>
      </form>
    {/if}

    {#if objectSchema.properties}
      {#key objectSchema.properties }
        <PropertiesBlock blockKey={objectSchema.key} properties={objectSchema.properties} />
      {/key}
    {/if}


  </div>

{:else}
  <div>
    <p>Object schema is undefined</p>
  </div>
{/if}