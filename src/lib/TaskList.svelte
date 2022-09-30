<script >
	import { TaskApply } from "./Task";



  export let taskList;
  let newJob = "";


  async function doJob(task_id) {
      var payload = {};
      try {
        const onlyInputs = document.querySelectorAll('#apply input[type="text"]');
        const formData = new FormData()
        formData.append("workflow_id", task_id)
        onlyInputs.forEach(input => {
          if(input.value != "")
          {console.log(JSON.stringify(input.name), input.value);
            formData.append(input.name, input.value);
          }}
          ); 

        formData.forEach((value, key) => {payload[key] = parseInt(value);});     
        console.log(payload)
        newJob = await TaskApply(payload);  
      }
      catch (e) {
        alert(JSON.stringify(e)) 
      }
    };
</script>

{#if taskList}

<h3 class='text-center' style="padding-top:15%;" >Task List</h3>

<h7 class='text-center'>*click the task name to see the default arguments</h7>

  <div class="container mt-3">
    <table class="table table-hover table-bordered">
      <thead>
        <tr>
          <th scope="col">ID</th>
          <th scope="col">Name</th>
          <th scope="col">Type</th>
          <th scope="col">Input</th>
          <th scope="col">Output</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>


{#each taskList as task}

<tr>

<th scope="row">{task.id}</th>
<td>

    <button type="button" class="btn material-icons text-primary" 
    data-bs-toggle="modal" data-bs-target="#task{task.id}">
        {task.name}
      </button>

    <div class="modal fade" id="task{task.id}" tabindex="-1" 
    aria-labelledby="task{task.id}Label" aria-hidden="true">

        <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
            <h5 class="modal-title" 
            id="#task{task.id}Label">{task.name} - default arguments</h5>
            <button type="button" class="btn-close" 
            data-bs-dismiss="modal" aria-label="Close"></button>

            </div>
            <div class="modal-body">
            {JSON.stringify(task.default_args, null, 2)}
            </div>

            <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>


</td>
<td>{task.resource_type}</td>
<td>{task.input_type}</td>
<td>{task.output_type}</td>

<td>

  <button type="button" class="btn material-icons text-primary" 
  data-bs-toggle="modal" data-bs-target="#workflow{task.id}">
      Apply
    </button>


    <div class="modal fade" id="workflow{task.id}" tabindex="-1" 
    aria-labelledby="workflow{task.id}Label" aria-hidden="true">

        <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
            <h5 class="modal-title" 
            id="#workflow{task.id}Label">Apply {task.name}</h5>
            <button type="button" class="btn-close" 
            data-bs-dismiss="modal" aria-label="Close"></button>

            </div>
            <div class="modal-body">
              <form id="apply" name="apply" class="flex mx-auto col-6">
    
                <div class="mb-3">
                  <input type="hidden" class="form-control" id="workflow_id" name="workflow_id"
                  disabled value="{task.id}">
                </div>

                <div class="mb-3">
                  <label for="project_id" class="form-label">Project Id</label>
                  <input type="text" class="form-control" id="project_id" name="project_id"
                  >
                </div>
          
                <div class="mb-3">
                  <label for="input_dataset_id" class="form-label">Input Dataset Id</label>
                  <input type="text" class="form-control" id="input_dataset_id" name="input_dataset_id"
                  >
                </div>

                <div class="mb-3">
                  <label for="output_dataset_id" class="form-label">Output Dataset Id</label>
                  <input type="text" class="form-control" id="output_dataset_id" name="output_dataset_id"
                  >
                </div>
              </form>
              <div class="modal-footer">

              <button type="button" class="btn btn-primary btn-sm" on:click|preventDefault={doJob(task.id)}>Submit Job</button>

            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
          </div>
          </div>
        </div>
      </div>


</td>
</tr>
{/each}
</tbody>
</table>
</div>

{/if}