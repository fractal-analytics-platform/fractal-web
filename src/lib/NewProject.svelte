<script>
  import { page } from "$app/stores";
  export let projectList;

  $: console.log("projects: " + projectList);

  async function doSubmit(event) {
    var payload = {};
    const formData = new FormData(event.target);
    formData.forEach((value, key) => {payload[key] = value;});
    console.log(page.projects);

    const res = await fetch(
      "http://127.0.0.1:8000/api/v1/project/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
		    credentials: "include",
        body: JSON.stringify(payload),
      }
    );
    if (res.status == 201) {
      var newProject = await res.json();
      projectList = [...projectList, newProject];
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

