<script>

	export let iterableValue = [];
	export let iterableType = undefined;

</script>

<div>
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

  {/each}
</div>