<script>
	import { getContext } from 'svelte';
	import PropertiesBlock from '$lib/components/common/jschema/PropertiesBlock.svelte';

	const context = getContext('jsonSchema');

	export let objectSchema = undefined;

	context.setDefaultValue(objectSchema.key, { ...objectSchema.value });

</script>

{#if objectSchema}
  <div style='background-color: #9e9e9e'>
    <p>Object property</p>

    {#if objectSchema.properties }
      <PropertiesBlock blockKey={objectSchema.key} properties={objectSchema.properties} />
    {/if}

  </div>

{:else}
  <div>
    <p>Object schema is undefined</p>
  </div>
{/if}