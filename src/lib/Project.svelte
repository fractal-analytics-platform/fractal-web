<script>
  export let project;
  import Dataset from "$lib/Dataset.svelte";

  let projectFormDisabled = true;
</script>

<div>
  <h2>{project.name} (id: {project.id})</h2>

  <form>
    <label>
      Project directory
      <input value={project.project_dir} disabled=true />
    </label>
    <br/>

    <label>
      Read only
      <input 
        type=checkbox
        checked={project.read_only}
        disabled={projectFormDisabled}
      />
    </label>
  </form>

  <div id="dataset-list">
    <h3>Dataset</h3>
    <ol>
      {#each project.dataset_list as ds}
        <Dataset bind:dataset={ds} projectId={project.id}/>
      {/each}
    </ol>

    <button>Add dataset</button>
  </div>
</div>

<style>
  div {
    padding: 1rem;
    box-shadow: -1px 1px 11px 4px #898989;
    margin: 20px;
  }
</style>
