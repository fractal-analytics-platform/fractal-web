<script>
  import Project from "$lib/Project.svelte";
  import { doLogout } from "$lib/login.svelte"
  import "/src/global.css"
  export let data;

  console.log(data.project)
</script>
<nav class="navbar navbar-expand-lg navbar-light bg-light">
  <a href="/me">Home</a>
  <a class="left" href="/task">Tasks</a>
<button class="btn btn-sm btn-primary" on:click={doLogout}>Logout</button>
</nav>
<Project bind:project={data.project} />
