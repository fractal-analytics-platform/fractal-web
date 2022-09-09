<script>
  import { page } from "$app/stores";
  import Projects from "$lib/Projects.svelte";

  export let data;
</script>


<h2>Projects</h2>

<Projects projects={ data.projects } />
