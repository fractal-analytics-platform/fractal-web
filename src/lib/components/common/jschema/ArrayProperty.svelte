<script>
	import { onMount } from 'svelte';
	import PropertyDiscriminator from '$lib/components/common/jschema/PropertyDiscriminator.svelte';

	export let schemaProperty = undefined;
	let nestedProperties = [];

	let accordionParentKey = schemaProperty.key.replaceAll('#', '');
	let collapseSymbol = accordionParentKey + '-collapse';

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
      <span>{schemaProperty.description }</span>
    </div>
    <div class='array-items my-2'>


      <div class='accordion accordion-flush' id='{accordionParentKey}'>
        <div class='accordion-item'>
          <div class='accordion-header'>
            <button class='accordion-button' type='button' data-bs-toggle='collapse'
                    data-bs-target='#{collapseSymbol}'>List aruments
            </button>
          </div>
          <div id='{collapseSymbol}' class='accordion-collapse collapse show' data-bs-parent='#{accordionParentKey}'>
            <div class='accordion-body p-1'>
              <div class='d-flex justify-content-center p-2'>
                <button class='btn btn-primary' on:click={addNestedProperty}>Add argument to list</button>
              </div>
              <div>
                {#each nestedProperties as nestedProperty, index (nestedProperty.key)}
                  <div class='d-flex'>
                    <div class='align-self-center m-2'>
                      <button class='btn btn-warning' on:click={removeNestedProperty(index)}>Remove</button>
                    </div>
                    <div class='flex-fill'>
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