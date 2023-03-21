<script>
  import { updateWorkflowTaskArguments } from "$lib/api/v1/workflow/workflow_api";

  // This component shall handle a form which the user can use to specify arguments of a workflow-task
  // Upon interacting with this component, a representation of the arguments to be used with a workflow task
  // shall be kept in memory with a key-value object.
  // This component shall permit to:
  // - insert a sequence of key-value-type items
  // - store the sequence in a coherent object
  // - enable the usage of the object that keeps the representation of the list

  export let workflowId = undefined
  export let workflowTaskId = undefined

  // The main property managed by this component
  export let workflowTaskArgs = {}

  // In the future the form could be managed entirely providing a given list of arguments available
  // let argsList = []
  $: argsList = workflowTaskArgsAsList(workflowTaskArgs)
  // What is an argument?
  // let argument = {
  //   name: 'arg',
  //   value: 'string value' | true/false | 123 // Default value
  //   type: 'string' | 'boolean' | 'number'
  // }

  function updateWorkflowTaskArgs(args) {
    let updatedWorkflowTaskArgs = {}
    args.forEach(arg => {
      let argType = undefined
      // Type conversion for server-side casting
      switch(arg.type) {
        case 'boolean':
          updatedWorkflowTaskArgs[arg.name] = JSON.parse(arg.value)
          break
        default:
          updatedWorkflowTaskArgs[arg.name] = arg.value
      }
    })
    return updatedWorkflowTaskArgs
  }

  function workflowTaskArgsAsList(args) {
    return Object.keys(args).map(key => {
      let typeOfKey = typeof args[key]
      return {
        name: key,
        value: args[key],
        type: typeOfKey
      }
    })
  }

  // New arguments handling
  let newArgumentInput = false
  let newArgument = {}

  async function showNewArgumentInput() {
    newArgumentInput = true
  }

  async function addNewArgument() {
    if (newArgument.name === undefined) throw new Error('Argument name can not be undefined')
    if (newArgument.name in workflowTaskArgs) throw new Error('Argument name is already in use')
    argsList.push(newArgument)
    let updatedWorkflowTaskArgs = updateWorkflowTaskArgs(argsList)
    // Save the new updatedWorkflowTaskArgs with a request to the server
    if (workflowId !== undefined && workflowTaskId !== undefined){
      await updateWorkflowTaskArguments(workflowId, workflowTaskId, updatedWorkflowTaskArgs)
        .then(result => {
          // If the server successfully updated the workflowTask args, update them reactively
          workflowTaskArgs = updatedWorkflowTaskArgs
          newArgument = {}
          newArgumentInput = false
        })
        .catch(error => {
          console.error(error)
          // If there is an error, should display such error
        })
    }
  }

  function cancelNewArgument() {
    newArgument = {}
    newArgumentInput = false
  }

</script>
<form>
  <p class="lead">Task arguments</p>

  {#each argsList as arg }
    <div class="d-flex justify-content-center align-items-center mb-3">
      <div class="col-8 me-3">
        {#if arg.type == 'string' }
          <div class="input-group">
            <span class="input-group-text">{arg.name} ({typeof arg.value})</span>
            <input type="text" class="form-control font-monospace" value="{arg.value}">
          </div>
        {:else if arg.type == 'number'}
          <div class="input-group">
            <span class="input-group-text">{arg.name} ({typeof arg.value})</span>
            <input type="number" class="form-control font-monospace" value="{arg.value}" lang="en" step="0.01">
          </div>
        {:else if arg.type == 'boolean'}
          <div class="form-check">
            <input type="checkbox" class="form-check-input" checked={arg.value} id="{arg.name}">
            <label class="form-check-label" for="{arg.name}"><code>{arg.name}</code></label>
          </div>
        {/if}
      </div>
      <div>
        <button class="btn btn-danger" disabled><i class="bi-trash"></i></button>
      </div>
    </div>
  {/each}

  {#if newArgumentInput }

    <div class="d-flex justify-content-center">
      <div class="col-8 me-3">
        <form on:submit|preventDefault={addNewArgument}>
          <div class="input-group mb-3">
            <input type="text" class="form-control" placeholder="Arg name" name="argumentName" bind:value={newArgument.name} required>
            {#if newArgument.type == 'string' }
              <input type="text" class="form-control w-50 font-monospace" placeholder="Argument default value" name="argumentValue" bind:value={newArgument.value}>
            {:else if newArgument.type == 'number' }
              <input type="number" class="form-control w-50 font-monospace" placeholder="Argument default value" bind:value={newArgument.value} step="0.01">
            {:else if newArgument.type == 'boolean' }
              <select class="form-select" bind:value={newArgument.value}>
                <option value=true><code>true</code></option>
                <option value=false><code>false</code></option>
              </select>
            {/if}
            <select name="" id="" class="form-select" bind:value={newArgument.type}>
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
            </select>
            <button class="btn btn-success" type="submit"><i class="bi-check"></i></button>
          </div>
        </form>
      </div>
      <div>
        <button class="btn btn-danger" on:click={cancelNewArgument}><i class="bi-trash"></i></button>
      </div>
    </div>

  {/if}

  <div class="d-flex justify-content-center align-items-center mt-3">
    <button class="btn btn-secondary" on:click|preventDefault={showNewArgumentInput}>Add argument <i class="text-bi-plus-square-fill"></i></button>
  </div>
</form>