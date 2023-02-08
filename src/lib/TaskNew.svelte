<script>
    import { TaskCreate } from "$lib/Task.js";
    export let taskList;
    let inputName = "";
    let inputType = "";
    let outputType = "";

    async function doSubmit(event) {
      var payload = {};
      const formData = new FormData(event.target);
      formData.forEach((value, key) => {payload[key] = value;});
  
      try {
        let newTask = await TaskCreate(payload);
        taskList = [...taskList, newTask];
        inputName.value = "";
        inputType.value = "";
        outputType.value = "";
      }
      catch (e) {
        alert(e + " - " + e.detail);
      }
    };
  </script>
  
  <h3 class='text-center' style="padding-top:10%;">New Task</h3>
  
  <form on:submit|preventDefault={doSubmit} style="padding-top:2%;" 
    id="task" class="flex mx-auto col-6">
    <div class="mb-3">
    <label for="name" class="form-label">Name:</label><br>
    <input type="text" class="form-control" id="name" name="name" bind:this={inputName}>
    </div>
  
    <div class="mb-3">
    <label for="input_type" class="form-label">Input Type</label><br>
    <input type="text" class="form-control" id="input_type" name="input_type" bind:this={inputType}>
    </div>

    <div class="mb-3">
        <label for="output_type" class="form-label">Output Type</label><br>
        <input type="text" class="form-control" id="output_type" name="output_type" bind:this={outputType}>
    </div>
  
    <label for="resource_type" class="form-label">Type</label><br>
    <select class="form-select" name="resource_type" id="resource_type" form="task" aria-label="Default">
        <option value="task">Task</option>
        <option value="workflow">Workflow</option>
    </select>
    
    <div class="d-grid gap-2 col-3 mx-auto" style="padding-top:5%;">
    <button type="submit" 
    class="btn btn-primary">Add</button>
    </div>
  </form>
  