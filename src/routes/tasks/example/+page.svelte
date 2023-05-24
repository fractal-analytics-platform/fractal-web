<script>
	import TaskSchema from '$lib/components/common/TaskSchema.svelte';

	const taskArgsValuesFromApi = {
		input_paths: ['/hello', '/new/path']
	};

	const taskSchemaFromApi = undefined;

	async function handleArgumentsUpdate(event) {
		console.log(event);
		// TODO: Send the updated arguments to the server
	}

</script>

<div>
  <h1>Workflow arguments list</h1>
  <TaskSchema
    argsValues={taskArgsValuesFromApi}
    taskSchema={taskSchemaFromApi}
    on:argumentsUpdated={handleArgumentsUpdate}
  />
</div>
