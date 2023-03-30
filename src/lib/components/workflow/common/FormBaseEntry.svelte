<script>
  // This is the base entry component of a form
  // This component handles the updating / editing / events the user does on a single input element of a form.
  // The component is responsible for handling the element form value and communicate it to external components.
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  export let entryName
  export let entryValue
  export let isListEntry = false
  export let listEntryIndex = undefined

  let entryType = typeof entryValue

  let editingEntry = false

  function saveEdits() {
    // This function signals that the user wants to save the edits made to the entry
    console.log(entryName, entryValue, entryType, isListEntry)

    if (entryType === 'number') {
      entryValue = Number.parseFloat(entryValue)
    }
    if (entryType === 'boolean') {
      entryValue = JSON.parse(entryValue)
    }

    // The editing completed
    dispatch('entryUpdated', {
      name: entryName,
      type: entryType,
      value: entryValue,
      listEntry: isListEntry,
      index: listEntryIndex
    })
    editingEntry = false
  }

</script>

<div class="mb-2">

  {#if !editingEntry }
    <div class="d-flex align-items-center">
      {#if !isListEntry}
        <ul class="list-group list-group-horizontal flex-fill overflow-hidden">
          <li class="list-group-item">
            <div class="d-flex h-100 align-items-center">
              <span class="">{entryName}</span>
            </div>
          </li>
          <li class="list-group-item text-monospace bg-light flex-fill overflow-hidden"><code>{entryValue}</code></li>
        </ul>
      {:else}
        <div class="input-group">
          <span class="input-group-text text-monospace bg-light flex-fill">{entryValue}</span>
        </div>
      {/if}
      <div class="ps-2">
        <button class="btn btn-secondary" on:click={() => editingEntry = true}><i class="bi-pencil-square"></i></button>
      </div>
    </div>
  {:else}

    <div class="d-flex">
      <form class="flex-fill">
        <div class="input-group">
          {#if !isListEntry}
            <div class="input-group-text col-3">{entryName}</div>
          {/if}
          {#if entryType === 'string' }
            <input type="text" class="form-control w-50 font-monospace" placeholder="Default value" bind:value={entryValue}>
          {:else if entryType === 'number' }
            <input type="number" class="form-control w-50 font-monospace" placeholder="Default value" bind:value={entryValue} step="0.01">
          {:else if entryType === 'boolean' }
            <select class="form-select" bind:value={entryValue}>
              <option value=true selected={entryValue}><code>true</code></option>
              <option value=false selected={!entryValue}><code>false</code></option>
            </select>
          {/if}
          <select class="form-select col-2" bind:value={entryType}>
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
          </select>
        </div>
      </form>
      <div class="ps-2">
        <button class="btn btn-primary" on:click={saveEdits}><i class="bi-check-square"></i></button>
        <button class="btn btn-danger" on:click|preventDefault={null} disabled><i class="bi-trash"></i></button>
      </div>
    </div>
  {/if}
</div>