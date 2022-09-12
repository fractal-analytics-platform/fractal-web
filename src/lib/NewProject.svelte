<script>
  import { ProjectCreate } from "$lib/Project.js";
  export let projectList;

  async function doSubmit(event) {
    var payload = {};
    const formData = new FormData(event.target);
    formData.forEach((value, key) => {payload[key] = value;});

    try {
      let newProject = await ProjectCreate(payload);
      projectList = [...projectList, newProject];
    }
    catch (e) {
      alert(e.status + " - " + e.detail);
    }
  };
</script>

<h3>New Prj</h3>

<form on:submit|preventDefault={doSubmit}>
  <label for="name">Name:</label><br>
  <input type="text" id="name" name="name"><br>

  <label for="name">Project directory:</label><br>
  <input type="text" id="project_dir" name="project_dir"><br>

  <input 
    type="submit"
    value="Add"
  />
</form>

