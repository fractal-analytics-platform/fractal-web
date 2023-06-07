<script>
	import { onMount, getContext } from 'svelte';
	import { resolveSchemaReference } from '$lib/components/common/jschema/utils.js';

	import NumberProperty from '$lib/components/common/jschema/NumberProperty.svelte';
	import StringProperty from '$lib/components/common/jschema/StringProperty.svelte';
	import BooleanProperty from '$lib/components/common/jschema/BooleanProperty.svelte';
	import ArrayProperty from '$lib/components/common/jschema/ArrayProperty.svelte';
	import ObjectProperty from '$lib/components/common/jschema/ObjectProperty.svelte';

	export let propertyData = undefined;
	export let propertyValue = undefined;

	const context = getContext('jsonSchema');

	onMount(() => {
		// Discriminate the property if required
		if (propertyData && propertyData.type === undefined) {
			// The propertyData.type should not be undefined
			if (propertyData.$ref !== undefined) {
				const resolvedSchema = resolveSchemaReference(propertyData.$ref, context.getSchema());
				// Intersect the resolved schema with the propertyData
				propertyData = { ...propertyData, ...resolvedSchema };
			}
		}
	});

	const key = crypto.randomUUID();

	if (propertyValue !== undefined) {
		propertyData.value = propertyValue;
	}

</script>

{#if propertyData && propertyData.type }

  <div id='root-{key}' class='accordion accordion-flush'>
    <div class='accordion-item'>
      <div class='accordion-header'>
        <button class='accordion-button collapsed' data-bs-toggle='collapse'
                data-bs-target='#ref-{key}'>{propertyData.title || 'Sub property'}</button>
      </div>
      <div id='ref-{key}' class='accordion-collapse collapse' data-bs-parent='#root-{key}'>
        <div class='accordion-body'>
          <div class='d-flex justify-content-between'>
            <div>
              <h2>{propertyData.title}</h2>
              <p>
                Default value
                <code>{propertyData.default}</code>
              </p>
            </div>
            <div class='w-100'>
              {#if propertyData.type === 'integer'}
                <NumberProperty
                  propertyKey={propertyData.key}
                  propertyValue={propertyData.value}
                  defaultValue={propertyData.default}
                />
              {/if}
              {#if propertyData.type === 'string'}
                <StringProperty
                  propertyKey={propertyData.key}
                  propertyValue={propertyData.value}
                  defaultValue={propertyData.default}
                />
              {/if}
              {#if propertyData.type === 'boolean'}
                <BooleanProperty
                  propertyKey={propertyData.key}
                  propertyValue={propertyData.value}
                  defaultValue={propertyData.default}
                />
              {/if}
              {#if propertyData.type === 'array'}
                <ArrayProperty arraySchema={propertyData}></ArrayProperty>
              {/if}
              {#if propertyData.type === 'object'}
                <ObjectProperty objectSchema={propertyData}></ObjectProperty>
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