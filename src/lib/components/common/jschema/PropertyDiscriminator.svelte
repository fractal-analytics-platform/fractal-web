<script>
	import NumberProperty from '$lib/components/common/jschema/NumberProperty.svelte';
	import StringProperty from '$lib/components/common/jschema/StringProperty.svelte';
	import BooleanProperty from '$lib/components/common/jschema/BooleanProperty.svelte';
	import ArrayProperty from '$lib/components/common/jschema/ArrayProperty.svelte';
	import ObjectProperty from '$lib/components/common/jschema/ObjectProperty.svelte';

	export let schemaProperty = undefined;

	const key = crypto.randomUUID();

</script>


{#if schemaProperty }

  <div id='block-{key}' class='property-block'>
    <div class='property-container'>
      {#if schemaProperty.type === 'integer'}
        <NumberProperty {schemaProperty} />
      {/if}
      {#if schemaProperty.type === 'string'}
        <StringProperty {schemaProperty} />
      {/if}
      {#if schemaProperty.type === 'boolean'}
        <BooleanProperty {schemaProperty} />
      {/if}
      {#if schemaProperty.type === 'array'}
        <ArrayProperty {schemaProperty}></ArrayProperty>
      {/if}
      {#if schemaProperty.type === 'object'}
        <ObjectProperty objectSchema={schemaProperty}></ObjectProperty>
      {/if}
    </div>
  </div>

{:else}

  <div>
    <p>Unable to display schema property | unknown property type</p>
  </div>

{/if}