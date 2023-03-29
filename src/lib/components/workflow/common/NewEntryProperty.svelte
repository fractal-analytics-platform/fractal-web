<script>

  // This is the object that should be modified by adding a new property
  export let entry
  export let propertyName = ''
  export let propertyValue = null
  export let propertyType = 'string' // string | number | boolean | object | array

  let activateInput = false

  export let submitNewEntry = undefined

  let uuid = undefined
  $: {
    if (activateInput) {
      uuid = Date.now().valueOf()
    }
  }

  function handleSubmitEntry(event) {
    // Set default value for propertyValue based on propertyType
    switch (propertyType) {
      case 'object':
        propertyValue = {}
        break
      case 'array':
        propertyValue = []
        break
      case 'string':
        propertyValue = propertyValue || ''
        break
      case 'boolean':
        propertyValue = JSON.parse(propertyValue) || false
        break
      case 'number':
        propertyValue = Number.parseFloat(propertyValue) || 0
        break
    }

    // Add the new property to the entry
    const entryType = typeof entry
    const isArray = Array.isArray(entry)
    if (entryType === 'object' && !isArray) {
      entry[propertyName] = propertyValue
    } else if (isArray) {
      entry.push(propertyValue)
    }

    // Submit the new entry
    submitNewEntry(entry)
    // Log submitted entry data
    console.debug(propertyName, propertyValue, typeof propertyValue, propertyType, entry)
    // If submitNewEntry is successful
    activateInput = false
    // Reset the form
    const form = event.target
    form.reset()
    resetComponent()
  }

  function resetComponent() {
    activateInput = false
    propertyName = ''
    propertyValue = null
    propertyType = 'string'
  }

</script>


{#if activateInput }

  <div class="d-flex justify-content-center">
    <div class="flex-fill me-2">
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
      <button class="btn btn-danger" on:click={resetComponent}><i class="bi-trash"></i></button>
    </div>
  </div>

{/if}

<div class="d-flex justify-content-center align-items-center mt-3">
  <button class="btn btn-secondary" on:click={() => activateInput = true}>Add property <i class="text-bi-plus-square-fill"></i></button>
</div>
