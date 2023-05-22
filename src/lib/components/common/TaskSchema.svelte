<script>
	import TaskArgument from '$lib/components/common/TaskArgument.svelte';

	const jsonTaskSchema = '{"title": "TaskArguments", "type": "object", "properties": {"x": {"title": "X", "description": "This is the description of argument x", "default": 0, "type": "integer"}, "y": {"title": "Y", "type": "string"}, "z": {"title": "Z", "description": "A boolean field", "default": true, "type": "boolean"}}, "additionalProperties": false}\n';
	const parsedSchema = JSON.parse(jsonTaskSchema);

	const schemaProperties = parsedSchema.properties;

	const taskArgumentsValues = {};
	const taskArguments = [];
	for (const [key, value] of Object.entries(schemaProperties)) {
		value.key = key;
		taskArguments.push(value);
		taskArgumentsValues[key] = schemaProperties[key].default;
	}

	console.log(taskArgumentsValues);

	function taskArgumentValueUpdated(event) {
		console.debug(event.detail.value);
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


