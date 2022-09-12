<script>
  import {ProjectDelete} from "$lib/Project.js";
  export let projectList;

  async function doDelete(project) {
    try {
      await ProjectDelete(project.id);
      projectList = projectList.filter((prj) => prj.id !== project.id);
    }
    catch (e) {
      alert(e) 
    }
  };

</script>

{#if projectList}
<h3>Project List to become </h3>
  {#each projectList as p}
    <div>
    <a href='/me/project/{p.id}'>{p.id} - {p.name}</a>
    <button on:click|preventDefault={doDelete(p)}>delete</button>
    </div>
  {/each}
{/if}

<style>
  div {
    padding: 1rem;
    box-shadow: -1px 1px 11px 4px #898989;
    margin: 20px;
  }
</style>
