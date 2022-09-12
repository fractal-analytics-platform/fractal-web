<script>
  import { page } from "$app/stores";
  import ProjectList from "$lib/ProjectList.svelte";
  import NewProject from "$lib/NewProject.svelte";

  export let data;
</script>


<h2>Projects</h2>

<NewProject bind:projectList={ data.projectList } />
<ProjectList bind:projectList={ data.projectList } />
