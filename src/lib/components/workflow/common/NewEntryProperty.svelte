<script>

  // This is the object that should be modified by adding a new property
  export let entry
  export let propertyName = ''
  export let propertyValue = null
  export let propertyType = 'string' // string | number | boolean | object | array

  export let activateInput = false

  const uuid = Date.now().valueOf()

  console.log(uuid)

  function handleSubmitEntry() {

  }

</script>


{#if activateInput }

  <div class="d-flex justify-content-center">
    <div class="col-10 me-3">
      <form id={uuid} on:submit|preventDefault={handleSubmitEntry}>
        <div class="input-group mb-3">
          <input type="text" class="form-control" placeholder="Arg name" bind:value={propertyName} required>
          {#if propertyType === 'string' }
            <input type="text" class="form-control w-50 font-monospace" placeholder="Argument default value" bind:value={propertyValue}>
          {:else if propertyType === 'number' }
            <input type="number" class="form-control w-50 font-monospace" placeholder="Argument default value" bind:value={propertyValue} step="0.01">
          {:else if propertyType === 'boolean' }
            <select class="form-select" bind:value={propertyValue}>
              <option value=true><code>true</code></option>
              <option value=false><code>false</code></option>
            </select>
          {/if}
          <select name="" id="" class="form-select" bind:value={propertyType}>
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
          </select>
        </div>
      </form>
    </div>
    <div>
      <button class="btn btn-primary" type="submit" form={uuid}><i class="bi-check-square"></i></button>
      <button class="btn btn-danger" on:click={null}><i class="bi-trash"></i></button>
    </div>
  </div>

{/if}
