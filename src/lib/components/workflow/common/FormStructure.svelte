<script>
  // This component is responsible to build the infrastructure of a form
  // Basically, given a property (entry) in input, based on its kind, this component will build a structure of
  // sub-components that will manipulate the entry
  import { createEventDispatcher } from 'svelte'
  import FormBaseEntry from "./FormBaseEntry.svelte";

  const dispatcher = createEventDispatcher()

  export let entry
  export let entryName = undefined
  let entryType = typeof entry
  let isArray = Array.isArray(entry)


  function handleEntryUpdate(event) {
    const updatedEntryName = event.detail.name
    const updatedValue = event.detail.value
    if (entryType === 'object' && !isArray) {
      // Do something with this kind of entry
      // The entry managed by this component is an object.
      // Within the event.detail there is the updated value set by the user.
      entry[updatedEntryName] = updatedValue
      dispatcher('entryUpdated', {
        name: entryName,
        type: entryType,
        value: entry
      })
    // The following code is probably not needed.
    // It will be left here for reference.
    } else if(isArray) {

      // The entry is an array. I received an updated object of that array.
      // I know the name property of such object
      // I could map thorugh the whole array and update the element value that matches with name

      // Update the entry
      // It could also be possible that entries passed through lists are modified by reference and not by value
      // The following could be optional then
      // entry[event.detail.index] = updatedValue

      dispatcher('entryUpdated', {
        name: entryName,
        type: entryType,
        value: entry
      })

    } else {
      // TODO: There is a problem with the format of boolean values it should be checked at a deeper level
      //  Probably should be checked at FormBaseEntry-level
      dispatcher('entryUpdated', {
        name: entryName,
        type: event.detail.type,
        value: event.detail.value
      })
    }
  }

</script>

<div class="mb-2">
  {#if entryType === 'object' && !isArray}
    <!-- If a entryName is set, then this is a nested-entry -->
    <!-- Should build an accordion -->
    {#if entryName}

      <div class="accordion">
        <div class="accordion-item">
          <div class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#{entryName}">
              {entryName} (obj)
            </button>
          </div>
          <div id="{entryName}" class="accordion-collapse collapse">
            <div class="accordion-body p-2">
              {#each Object.entries(entry) as [key, value]}
                <svelte:self entry={value} entryName={key} on:entryUpdated={handleEntryUpdate}/>
              {/each}
            </div>
          </div>
        </div>
      </div>

    {:else}
      <!-- Should build a sequence of components that will enable the editing of each object properties -->
      {#each Object.entries(entry) as [key, value]}
        <svelte:self entry={value} entryName={key} on:entryUpdated={handleEntryUpdate}/>
      {/each}
    {/if}
  {/if}

  {#if isArray}
    <!-- Should build an accordion, but one for each element in the list -->
    {#if entryName}
      {@debug entryName}
      <div class="accordion">
        <div class="accordion-item">
          <div class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#{entryName}">
              {entryName} (list)
            </button>
          </div>
          <div id="{entryName}" class="accordion-collapse collapse">
            <div class="accordion-body p-2">
              {#each entry as listItem}
                <svelte:self entry={listItem} on:entryUpdated={handleEntryUpdate} />
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}
  {/if}

  {#if entryType !== 'object'}
    <!-- If it is neither an object, nor a list, just display base entry components -->
    {#if entryName}
      <FormBaseEntry {entryName} entryValue={entry} on:entryUpdated={handleEntryUpdate}></FormBaseEntry>
    {/if}
  {/if}
</div>