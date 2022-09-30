<script>
  import TaskNew from "$lib/TaskNew.svelte"
  import TaskList from "$lib/TaskList.svelte"
  import { doLogout } from "$lib/login.svelte"
  import "/src/global.css"

  export let data;
</script>

<nav class="navbar navbar-expand-lg navbar-light bg-light" >
  <a href="/me">Home</a>
  <a class="left" href="/task">Tasks</a>
<button class="btn btn-sm btn-primary" on:click={doLogout}>Logout</button>
</nav>

<TaskNew bind:taskList={ data.taskList }></TaskNew>
<hr>
<TaskList bind:taskList={ data.taskList }></TaskList>