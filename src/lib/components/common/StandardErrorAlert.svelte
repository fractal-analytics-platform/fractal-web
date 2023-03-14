<script>

  export let error = undefined

  $: errorString = JSON.stringify(error, undefined, 2)

  if (errorString) {
    console.log('error string')
  }

</script>

{#if errorString }
  <div class="alert alert-danger alert-dismissible">
    <pre>There has been an error, reason:</pre>
    <pre>{errorString}</pre>
    <button class="btn-close" data-bs-dismiss="alert" on:click={errorString = undefined}></button>
  </div>
{/if}
