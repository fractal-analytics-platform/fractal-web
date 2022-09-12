<script>
  export let project;
  export let projectList;

  async function doDelete() {
    const res = await fetch(
      "http://127.0.0.1:8000/api/v1/project/" + project.id,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
		    credentials: "include",
      }
    );
    if (res.ok) {
      projectList = projectList.filter((prj) => prj.id !== project.id);
    }
  };
</script>

<div>
<p>{project.id} - {project.name}</p>
<button on:click|preventDefault={doDelete}>delete</button>
</div>

<style>
  div {
    padding: 1rem;
    box-shadow: -1px 1px 11px 4px #898989;
    margin: 20px;
  }
</style>
