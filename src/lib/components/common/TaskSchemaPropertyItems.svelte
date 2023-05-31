<script>

	// The property items
	export let value = [];
	// The items schema
	export let itemsSchema = undefined;

	let itemType = undefined;
	let itemProperties = undefined;
	let itemItems = undefined;

	if (itemsSchema !== undefined) {
		itemType = itemsSchema.type;
		itemProperties = itemsSchema.properties;
		itemItems = itemsSchema.items;
	}

	const addItem = function() {
		let defaultValue = undefined;
		// Set default value given item type
		if (itemType === 'integer') {
			defaultValue = 0;
		} else if (itemType === 'string') {
			defaultValue = '';
		} else if (itemType === 'boolean') {
			defaultValue = false;
		} else if (itemType === 'array') {
			defaultValue = [];
		}
		value.push(defaultValue);
		value = value;
	};

</script>

<div class='bg-light p-2' style='border: 1px solid #ccc'>
  <p>Property items of type <code>{itemType}</code></p>
  {#each value as iterValue, index }
    <p>#{index} - {iterValue}</p>

    {#if itemType === 'integer' }
      <input type='number' bind:value={iterValue}>
    {/if}

    {#if itemType === 'string' }
      <input type='text' bind:value={iterValue}>
    {/if}

    {#if itemType === 'boolean' }
      <input type='checkbox' bind:checked={iterValue}>
    {/if}

    {#if itemType === 'array' }
      <svelte:self value={iterValue} itemsSchema={itemItems}></svelte:self>
    {/if}
    <button class='btn btn-default'><i class='bi bi-dash-square'></i></button>

  {/each}

  <div>
    <button class='btn btn-default' on:click={addItem}><i class='bi bi-plus-square'></i></button>
  </div>
</div>