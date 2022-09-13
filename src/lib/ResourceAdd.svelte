<script>
  import { ResourceAdd } from "$lib/Project.js";
  let showEditResource = false;
  export let projectId;
  export let datasetId;
  export let resource_list;

  function showForm() {
    showEditResource = true;
  }
  function hideForm() {
    showEditResource = false;
  }

  async function addResource(event) {
    var payload = {};
    const formData = new FormData(event.target);
    console.log(formData);
    formData.forEach((value, key) => {payload[key] = value;});

    try {
      let newResource = await ResourceAdd(projectId, datasetId, payload);
      resource_list = [...resource_list, newResource];
    }
    catch (e) {
      console.log(e);
      alert(JSON.stringify(e));
    }
  }
</script>

<div id="add-resource">
  {#if showEditResource}
    <form on:submit|preventDefault={addResource}>
    <label>
      Path
      <input id="path" name="path" />
    </label>
    <label>
      Glob pattern
      <input id="glob_pattern" name="glob_pattern" />
    </label>
    <input type=submit />
  <button on:click|preventDefault={hideForm}>Cancel</button>
  </form>
  {:else}
  <button on:click|preventDefault={showForm}>Add resource</button>
  {/if}

</div>
