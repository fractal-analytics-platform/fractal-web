<script>
  import { page } from "$app/stores";
  import Project from "$lib/Project.svelte"

  export let projectList;
</script>

{#if projectList}
<h3>Project List to become </h3>
  {#each projectList as p}
    <Project project={p} />
  {/each}
{/if}
