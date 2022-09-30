<script>
  export let project;
  import Dataset from "$lib/Dataset.svelte";

  let projectFormDisabled = true;
</script>

<h1 class='text-center' style="padding-top:5%;">{project.name}</h1>
<div class="container mt-3">

  <div class="container" style="padding-bottom:2%;background-color:lightgrey;">
    
    <div class="row" align="center">
      <div class="col-md-12" align="center">
    <h7>General Informations: </h7>
      </div>

      <div class="col-md-12">
    <ul class="list-group list-group-flush">

      <li class="list-group-item">Id: {project.id}</li>

      <li class="list-group-item">

        <label>
          Project directory
          <input value={project.project_dir} disabled=true />
        </label>

      </li>

      <li class="list-group-item">
        
        <label>
          Read only
          <input 
            type=checkbox
            checked={project.read_only}
            disabled={projectFormDisabled}
          />
        </label>

      </li>

    </ul>
    </div>

  </div>
  </div>


  <div class="container" style="padding-top:5%;"  id="dataset-list">
    <h4 class='text-center'>Datasets</h4>
      
      <div class="container text-center" style="padding-top: 2%;">
      <button type="submit" class="btn btn-primary btn-sm text-center">Add Dataset</button>
      </div>
    


      {#each project.dataset_list as ds}
       <div class="ds-div">
       <Dataset bind:dataset={ds} projectId={project.id}/>
       </div>
      {/each}
    
  </div>


</div>

