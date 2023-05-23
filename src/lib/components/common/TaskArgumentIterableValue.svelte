<script>

	export let iterableValue = [];
	export let iterableSchema = undefined;

	let iterableType = undefined;
	if (iterableSchema !== undefined) {
		iterableType = iterableSchema.type;
	}

</script>

<div>
  <p>{iterableType}</p>
  {#each iterableValue as iterValue, index }
    <p>#{index} - {iterValue}</p>

    {#if iterableType === 'integer' || iterableType === 'number'}
      <input type='number' bind:value={iterValue}>
    {/if}

    {#if iterableType === 'string' || iterableType === 'str'}
      <input type='text' bind:value={iterValue}>
    {/if}

    {#if iterableType === 'boolean' || iterableType === 'bool'}
      <input type='checkbox' bind:checked={iterValue}>
    {/if}

    {#if iterableType === 'array' || iterableType === 'list'}
      <svelte:self iterableValue={iterValue} iterableSchema={iterableSchema.items}></svelte:self>
    {/if}

  {/each}
</div>