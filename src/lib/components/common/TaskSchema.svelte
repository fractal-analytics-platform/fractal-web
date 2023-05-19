<script>
	import TaskArgument from '$lib/components/common/TaskArgument.svelte';

	const jsonTaskSchema = '{"title": "TaskArguments", "type": "object", "properties": {"x": {"title": "X", "description": "This is the description of argument x", "type": "integer"}, "y": {"title": "Y", "type": "string"}}, "required": ["x"], "additionalProperties": false}\n';
	const parsedSchema = JSON.parse(jsonTaskSchema);

	const schemaProperties = parsedSchema.properties;

	const taskArgumentsValues = {};
	const taskArguments = [];
	for (const [key, value] of Object.entries(schemaProperties)) {
		value.key = key;
		taskArguments.push(value);
		taskArgumentsValues[key] = schemaProperties[key].defaultValue || 'something';
	}

	console.log(taskArgumentsValues);

	function taskArgumentValueUpdated(event) {
		console.log('The task argument has updated', event.detail.key, event.detail.value);
		taskArgumentsValues[event.detail.key] = event.detail.value;
		console.log(taskArgumentsValues);
	}

</script>

<div>

  {#each taskArguments as taskProperty }

    <TaskArgument
      key={taskProperty.key}
      title={taskProperty.title}
      description={taskProperty.description}
      type={taskProperty.type}
      value={taskArgumentsValues[taskProperty.key]}
      defaultValue={taskProperty.defaultValue}
      on:argumentUpdated={taskArgumentValueUpdated}
    />

  {/each}

</div>


