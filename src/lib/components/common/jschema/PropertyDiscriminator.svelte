<script>
	import NumberProperty from '$lib/components/common/jschema/NumberProperty.svelte';
	import StringProperty from '$lib/components/common/jschema/StringProperty.svelte';
	import BooleanProperty from '$lib/components/common/jschema/BooleanProperty.svelte';
	import ArrayProperty from '$lib/components/common/jschema/ArrayProperty.svelte';
	import ObjectProperty from '$lib/components/common/jschema/ObjectProperty.svelte';

	export let schemaProperty = undefined;
	export let propertyValue = undefined;

	const key = crypto.randomUUID();

</script>

{#if schemaProperty }

  <div id='root-{key}' class='accordion accordion-flush'>
    <div class='accordion-item'>
      <div class='accordion-header'>
        <button class='accordion-button collapsed' data-bs-toggle='collapse'
                data-bs-target='#ref-{key}'>{schemaProperty.title || 'Sub property'}</button>
      </div>
      <div id='ref-{key}' class='accordion-collapse collapse' data-bs-parent='#root-{key}'>
        <div class='accordion-body'>
          <div class='d-flex justify-content-between'>
            <div>
              <h2>{schemaProperty.title}</h2>
              <p>
                Default value
                <code>{schemaProperty.defaultValue}</code>
              </p>
              <p>{schemaProperty.description || 'No description'}</p>
            </div>
            <div class='w-100'>
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
        </div>
      </div>
    </div>
  </div>


{:else}

  <div>
    <p>Unable to display schema property | unknown property type</p>
  </div>

{/if}