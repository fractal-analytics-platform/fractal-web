<script>
  import { ResourceAdd } from "$lib/Project.js";
  let showEditResource = false;
  export let projectId;
  export let datasetId;
  export let resource_list;
  let inputPath = "";
  let inputPattern = "";

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
      inputPath.value = "";
      inputPattern.value = ""; 
    }
    catch (e) {
      console.log(e);
      alert(JSON.stringify(e));
    }
  }
</script>

<div id="add-resource">
  {#if showEditResource}
    <form on:submit|preventDefault={addResource} class="flex mx-auto col-6">
    
      <div class="mb-3">
        <label for="path" class="form-label">Path</label><br>
        <input type="text" class="form-control" id="path" name="path" bind:this={inputPath}
        >
      </div>

      <div class="mb-3">
        <label for="glob_pattern" class="form-label">Glob Pattern</label><br>
        <input type="text" class="form-control" id="glob_pattern" name="glob_pattern" bind:this={inputPattern}
        >
      </div>

    <button type="submit" class="btn btn-light btn-sm">Add</button>

  <button  type="submit" class="btn btn-light btn-sm" on:click|preventDefault={hideForm}>Cancel</button>
  </form>
  {:else}
  <div class="container" style="padding-top: 2%;">
  <button type="submit" class="btn btn-primary btn-sm text-center" on:click|preventDefault={showForm}>Add resource</button>
  </div>
  {/if}

</div>
