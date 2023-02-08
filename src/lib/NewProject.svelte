<script>
  import { ProjectCreate } from "$lib/Project.js";
  export let projectList;
  let inputName = "";
  let inputDir = "";

  async function doSubmit(event) {
    var payload = {};
    const formData = new FormData(event.target);
    formData.forEach((value, key) => {payload[key] = value;});

    try {
      let newProject = await ProjectCreate(payload);
      projectList = [...projectList, newProject];
      inputName.value = "";
      inputDir.value = "";
    }
    catch (e) {
      alert(e + " - " + e.detail);
    }
  };
</script>

<h3 class='text-center' style="padding-top:10%;">New Project</h3>

<form on:submit|preventDefault={doSubmit} style="padding-top:5%;" class="flex mx-auto col-6">
  <div class="mb-3">
  <label for="name" class="form-label">Name:</label><br>
  <input type="text" class="form-control" id="name" name="name" bind:this={inputName}
  >
  </div>

  <div class="mb-3">
  <label for="name" class="form-label">Project directory:</label><br>
  <input type="text" class="form-control" id="project_dir" name="project_dir" bind:this={inputDir}>
  </div>

  <div class="d-grid gap-2 col-3 mx-auto">
  <button type="submit" class="btn btn-primary">Add</button>
  </div>
</form>
