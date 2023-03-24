<script>
  import { enhance } from '$app/forms'
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
      let argumentValue = args[key]
      if (typeOfKey === 'object') {
        let argKeys = Object.keys(argumentValue)
        let listValue = []
        argKeys.forEach(k => {
          listValue.push({
            name: k,
            value: argumentValue[k],
            type: typeof argumentValue[k]
          })
        })
        argumentValue = listValue
      }

      return {
        name: key,
        value: argumentValue,
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
    let createArgumentPayload = {}

    let argumentValue = newArgument.value
    switch(newArgument.type){
      case 'number':
        argumentValue = Number.parseFloat(newArgument.value)
        break;
      case 'boolean':
        argumentValue = JSON.parse(newArgument.value)
        break;
      case 'object':
        argumentValue = {}
        break;
    }
    createArgumentPayload[newArgument.name] = argumentValue

    // Save the new updatedWorkflowTaskArgs with a request to the server
    if (workflowId !== undefined && workflowTaskId !== undefined){
      await updateWorkflowTaskArguments(workflowId, workflowTaskId, createArgumentPayload)
        .then(result => {
          // If the server successfully updated the workflowTask args, update them reactively
          workflowTaskArgs = result.args
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

  // Arguments editing
  let editingKey = undefined
  let editingArg = undefined

  function setEditingKey(key) {
    // Key is the key of the argument within the workflowTaskArgs obj
    editingKey = key
    let argument = argsList.find(arg => arg.name === key)
    editingArg = {
      name: argument.name,
      value: argument.value,
      type: argument.type
    }
  }

  async function updateWorkflowTaskArgument({ form, data, cancel }){
    // Prevent default
    cancel()

    let updateArgument = {}
    const argumentName = data.get('argumentName')
    let updatedValue = data.get('updatedArgValue')
    const updatedType = data.get('updatedArgType')

    const argument = argsList.find(arg => arg.name === argumentName)
    // Check if the argument is an object
    if (argument.type === 'object') {
      // In this case we have to behave differently
      // We have to build an update argument that matches the structure of the updated workflow task argument
      // "argName": { "key": { "key1": value1, "key2": value2 }

      // First, set to an empty obj
      updateArgument[argument.name] = {}

      // For each sub-argument within the root argument, set the updated values
      argument.value.forEach(arg => {
        let updatedValue = data.get(`${arg.name}Value`)
        let argumentName = data.get(`${arg.name}Name`)
        switch (arg.type) {
          case 'number':
            updatedValue = Number.parseFloat(updatedValue)
            break;
          case 'boolean':
            updatedValue = JSON.parse(updatedValue)
            break;
        }
        updateArgument[argument.name][argumentName] = updatedValue
      })

    } else {
      switch (updatedType) {
        case 'number':
          updatedValue = Number.parseFloat(updatedValue)
      }

      // Type conversion for server-side casting
      switch(updatedType) {
        case 'boolean':
          updateArgument[argumentName] = JSON.parse(updatedValue)
          break
        default:
          updateArgument[argumentName] = updatedValue
      }
    }



    await updateWorkflowTaskArguments(workflowId, workflowTaskId, updateArgument)
      .then((response) => {
        workflowTaskArgs = response.args
        editingKey = undefined
        form.reset()
      })
      .catch(error => {
        console.error(error)
      })

  }

  function addPropertyToEditingArgument() {
    // This function is only valid if the editing arg value is actually a list
    if (!Array.isArray(editingArg.value)) {
      console.error('The editing arg is not an array')
    }

    editingArg.value.push({
      name: "",
      value: "",
      type: ""
    })
    // Update the UI
    editingArg = editingArg
  }

</script>
<form>
  {#each argsList as arg }
    <div class="d-flex justify-content-center align-items-center mb-3">
      {#if arg.name !== editingKey }
        <div class="col-8 me-3">
          {#if arg.type !== 'object' }
            <div class="input-group">
              <span class="input-group-text col-4">{arg.name} ({typeof arg.value})</span>
              <span class="input-group-text text-monospace bg-light col-8">{arg.value}</span>
            </div>
          {:else}
            <div class="bg-light py-3 pe-3 rounded">
              {#each arg.value as listArg }
                <div class="input-group ms-3 pe-3 pb-2">
                  <span class="input-group-text col-4">{listArg.name} ({listArg.type})</span>
                  <span class="input-group-text text-monospace bg-light col-8">{listArg.value}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        <div>
          <button class="btn btn-secondary" on:click|preventDefault={setEditingKey.bind(this, arg.name)}><i class="bi-pencil-square"></i></button>
          <!--<button class="btn btn-danger" disabled><i class="bi-trash"></i></button>-->
        </div>
      {:else}
        {#if editingArg.type !== 'object' }
          <div class="col-8 me-3">
            <form id="updateArgumentForm" method='post' use:enhance={updateWorkflowTaskArgument}>
              <div class="input-group">
                <span class="input-group-text col-3">{editingArg.name}</span>
                <input type="text" class="visually-hidden" name="argumentName" value="{editingArg.name}">
                {#if editingArg.type == 'string' }
                  <input type="text" class="form-control w-50 font-monospace" placeholder="Argument default value" name="updatedArgValue" value={editingArg.value}>
                {:else if editingArg.type == 'number' }
                  <input type="number" class="form-control w-50 font-monospace" placeholder="Argument default value" name="updatedArgValue" value={editingArg.value} step="0.01">
                {:else if editingArg.type == 'boolean' }
                  <select class="form-select" name="updatedArgValue">
                    <option value=true selected={editingArg.value ? true : false}><code>true</code></option>
                    <option value=false selected={editingArg.value ? false : true}><code>false</code></option>
                  </select>
                {/if}
                <select name="updatedArgType" class="form-select col-2" bind:value={editingArg.type}>
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                </select>
              </div>
            </form>
          </div>
          <div>
            <button form="updateArgumentForm" class="btn btn-primary" type="submit"><i class="bi-check-square"></i></button>
            <button class="btn btn-danger" on:click|preventDefault={null} disabled><i class="bi-trash"></i></button>
          </div>
        {:else if editingArg.type === 'object'}
          <div class="col-8 me-3 p-3">
            <form id="updateArgGroup" method="post" use:enhance={updateWorkflowTaskArgument}>
              {#each editingArg.value as listArg }
                <div class="d-flex justify-content-between mb-2">
                  <div class="col-10">
                    <div class="input-group">
                      <span class="input-group-text">{editingArg.name}</span>
                      <input type="text" class="visually-hidden" name="argumentName" value="{editingArg.name}">
                      <input type="text" class="form-control" name="{listArg.name}Name" value="{listArg.name}">
                      {#if listArg.type == 'string' }
                        <input type="text" class="form-control w-50 font-monospace" placeholder="Argument default value"
                               name="{listArg.name}Value" value={listArg.value}>
                      {:else if listArg.type == 'number' }
                        <input type="number" class="form-control w-50 font-monospace"
                               placeholder="Argument default value" name="{listArg.name}Value" value={listArg.value}
                               step="0.01">
                      {:else if listArg.type == 'boolean' }
                        <select class="form-select" name="{listArg.name}Value">
                          <option value="true" selected={listArg.value ? true : false}><code>true</code></option>
                          <option value="false" selected={listArg.value ? false : true}><code>false</code></option>
                        </select>
                      {/if}
                      <select name="{listArg.name}Type" class="form-select col-2" bind:value={listArg.type}>
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                      </select>
                    </div>
                  </div>
                </div>
              {/each}
            </form>
            <div>
              <button class="btn btn-light" on:click|preventDefault={addPropertyToEditingArgument}>Add argument</button>
              <button form="updateArgGroup" class="btn btn-primary" type="submit">Update <i class="bi-check-square"></i>
              </button>
              <button class="btn btn-danger" on:click|preventDefault={null} disabled><i class="bi-trash"></i></button>
            </div>
          </div>
        {/if}
      {/if}
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
              <option value="object">Object</option>
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