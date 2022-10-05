<script>
  export let project;
  import Dataset from "$lib/Dataset.svelte";
  import { ProjectAddDataset } from "$lib/Project"
  import Swal from 'sweetalert2'
  let newDataset_status; 

  let projectFormDisabled = true;


  async function addDataset(project_id) {
      var payload = {};
      try {
        const onlyInputs = document.querySelectorAll('#addDataset input[type="text"]');
        const formData = new FormData()
        formData.append("project_id", project_id)
        onlyInputs.forEach(input => {
          if(input.value != "")
          {console.log(JSON.stringify(input.name), input.value);
            formData.append(input.name, input.value);
          }}
          ); 

        formData.forEach((value, key) => {payload[key] = value;});     
        newDataset_status = await ProjectAddDataset(project_id, payload);
        project.dataset_list = [...project.dataset_list, newDataset_status[0]];
        console.log(newDataset_status[0])

        if (newDataset_status[1] == 201) {

          Swal.fire(
            'Dataset created', // TODO: add job id 
            'success'
          )
        }

      }
      catch (e) {
        alert(JSON.stringify(e)) 
      }
    };




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
      <!-- <button type="submit" class="btn btn-primary btn-sm text-center"> -->
        
        <button type="button" class="btn btn-primary btn-sm text-center" 
        data-bs-toggle="modal" data-bs-target="#project{project.id}">
        Add Dataset</button>

        <div class="modal fade" id="project{project.id}" tabindex="-1" 
        aria-labelledby="project{project.id}Label" aria-hidden="true">
    
            <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                <h5 class="modal-title" 
                id="#project{project.id}Label">Dataset new</h5>
                <button type="button" class="btn-close" 
                data-bs-dismiss="modal" aria-label="Close"></button>
    
                </div>
                <div class="modal-body">
                  <form id="addDataset" name="addDataset" class="flex mx-auto col-6">
        
                    <div class="mb-3">
                      <input type="hidden" class="form-control" id="project_id" name="project_id"
                      disabled value="{project.id}">
                    </div>
                 
                    <div class="mb-3">
                      <label for="name" class="form-label">Name</label>
                      <input type="text" class="form-control" id="name" name="name"
                    >
                    </div>

    
                  </form>
                  <div class="modal-footer">
    
                  <button type="button" class="btn btn-primary btn-sm" on:click|preventDefault={addDataset(project.id)}>Create</button>
    
                <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
              </div>
              </div>
            </div>
            </div>
          </div>
        </div>


      {#each project.dataset_list as ds}
       <div class="ds-div">
       <Dataset bind:dataset={ds} projectId={project.id}/>
       </div>
      {/each}
    
  </div>


</div>

