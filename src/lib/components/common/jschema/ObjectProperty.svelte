<script>
	import PropertiesBlock from '$lib/components/common/jschema/PropertiesBlock.svelte';

	export let objectSchema = undefined;

	let customObjectPropertyKey = undefined;
	let addNestedObjectError = undefined;

	let accordionParentKey = objectSchema.key.replaceAll('#', '');
	let collapseSymbol = accordionParentKey + '-collapse';

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

  <div style='background-color: #9e9e9e' class='d-flex flex-column p-2'>
    <div class='property-metadata d-flex flex-column w-50'>
      <span class='fs-4 {objectSchema.isRequired() ? "fw-bold" : ""}'>{ objectSchema.title }</span>
      <span>{ objectSchema.description }</span>
    </div>
    <div class='object-properties my-2'>
      <div class='accordion' id='{accordionParentKey}'>
        <div class='accordion-item'>
          <div class='accordion-header'>
            <button class='accordion-button collapsed' type='button' data-bs-toggle='collapse'
                    data-bs-target='#{collapseSymbol}'>Argument Properties
            </button>
          </div>
          <div id='{collapseSymbol}' class='accordion-collapse collapse' data-bs-parent='#{accordionParentKey}'>
            <div class='accordion-body'>
              {#if objectSchema.hasCustomKeyValues}
                <div class='d-flex justify-content-center'>
                  <form class='row row-cols-auto g-3 align-items-center p-2'>
                    <div class='col-6'>
                      <input type='text' bind:value={customObjectPropertyKey} placeholder='Key' class='form-control'>
                    </div>
                    <div class='col-6'>
                      <button class='btn btn-primary' on:click={addNestedObjectProperty}>Add property</button>
                    </div>
                  </form>
                </div>
                {#if objectSchema.properties}
                  {#key objectSchema.properties }
                    <PropertiesBlock blockKey={objectSchema.key} properties={objectSchema.properties}
                                     removePropertyBlock={(propertyKey) => {
              propertyKey = propertyKey.split(objectSchema.manager.keySeparator).pop();
              objectSchema.removeProperty(propertyKey);
              objectSchema = objectSchema;
            }} />
                  {/key}
                {/if}
              {:else}
                {#if objectSchema.properties}
                  {#key objectSchema.properties }
                    <PropertiesBlock blockKey={objectSchema.key} properties={objectSchema.properties} />
                  {/key}
                {/if}
              {/if}
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

{:else}


  <!--
  {#if objectSchema}
    <div style='background-color: #9e9e9e'>
      <p>Object property</p>

      {#if objectSchema.hasCustomKeyValues}
        <p>Custom key values</p>
        <form action=''>
          <input type='text' bind:value={customObjectPropertyKey} placeholder='Key'>
          <button on:click={addNestedObjectProperty}>Add property</button>
        </form>
        {#if objectSchema.properties}
          {#key objectSchema.properties }
            <PropertiesBlock blockKey={objectSchema.key} properties={objectSchema.properties} removePropertyBlock={(propertyKey) => {
              propertyKey = propertyKey.split(objectSchema.manager.keySeparator).pop();
              objectSchema.removeProperty(propertyKey);
              objectSchema = objectSchema;
            }} />
          {/key}
        {/if}
      {:else}
        {#if objectSchema.properties}
          {#key objectSchema.properties }
            <PropertiesBlock blockKey={objectSchema.key} properties={objectSchema.properties} />
          {/key}
        {/if}
      {/if}
    </div>

  {:else}
  -->
  <div>
    <p>Object schema is undefined</p>
  </div>
{/if}