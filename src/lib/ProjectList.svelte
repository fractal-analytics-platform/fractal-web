<script>
  import Project from "$lib/Project.svelte"

  export let projectList;
</script>

{#if projectList}
<h3>Project List to become </h3>
  {#each projectList as p}
    <Project bind:projectList={projectList} project={p} />
  {/each}
{/if}
