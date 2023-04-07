<script>

  export let handler
  export let key
  export let label
  let filterLabel = label

  let sorted
  $: {
    sorted = handler.getSorted()
    if ($sorted.identifier === key) {
      if ($sorted.direction === 'asc') {
        filterLabel = label + ' ▲'
      } else {
        filterLabel = label + ' ▼'
      }
    } else {
      filterLabel = label
    }
  }

</script>

<th
  on:click={handler.sort(key)}
>{filterLabel}</th>