<script>
  import ProjectList from "$lib/ProjectList.svelte"
  import NewProject from "$lib/NewProject.svelte"
  import { doLogout } from "$lib/login.svelte"
  import "/src/global.css"

  export let data;
</script>

<nav class="navbar navbar-expand-lg navbar-light bg-light" >
  <a href="/me">Home</a>
  <a class="left" href="/task">Tasks</a>
<button class="btn btn-sm btn-primary" on:click={doLogout}>Logout</button>
</nav>


<NewProject bind:projectList={ data.projectList } />
<hr>
<ProjectList bind:projectList={ data.projectList } />

