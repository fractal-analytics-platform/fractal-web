<script>
	import TaskArgument from '$lib/components/common/TaskArgument.svelte';

	const jsonTaskSchema = '{"title": "TaskArguments", "type": "object", "properties": {"a": {"title": "A", "description": "This is the description of argument a", "default": 0, "type": "integer"}, "b": {"title": "B", "type": "string"}, "c": {"title": "C", "description": "A boolean field", "default": true, "type": "boolean"}, "d": {"title": "D", "description": "A list of numbers", "default": [0, 1, 2], "type": "array", "items": {"type": "integer"}}, "e": {"title": "E", "description": "A list of strings", "default": ["hello", "this", "test"], "type": "array", "items": {"type": "string"}}, "f": {"title": "F", "description": "A list of bools", "default": [true, false, false], "type": "array", "items": {"type": "boolean"}}, "g": {"title": "G", "description": "A nested list of integers", "default": [[1, 2], [3, 4], [5], [6]], "type": "array", "items": {"type": "array", "items": {"type": "integer"}}}, "h": {"title": "H", "description": "A nested list of strings", "default": [["this", "is"], ["a", "list"], ["of"], ["strings"]], "type": "array", "items": {"type": "array", "items": {"type": "string"}}}, "i": {"title": "I", "description": "A nested list of bools", "type": "array", "items": {"type": "array", "items": {"type": "boolean"}}}}, "required": ["i"], "additionalProperties": false}\n';
	const parsedSchema = JSON.parse(jsonTaskSchema);

	const schemaProperties = parsedSchema.properties;

	const taskArgumentsValues = {};
	const taskArguments = [];
	for (const [key, value] of Object.entries(schemaProperties)) {
		value.key = key;
		taskArguments.push(value);
		taskArgumentsValues[key] = schemaProperties[key].default;
	}

	function taskArgumentValueUpdated(event) {
		console.debug('The task argument has updated', event.detail.key, event.detail.value);
		taskArgumentsValues[event.detail.key] = event.detail.value;
		console.debug(taskArgumentsValues);
	}

</script>

<div>

  {#each taskArguments as taskProperty }

    <TaskArgument
      key={taskProperty.key}
      title={taskProperty.title}
      description={taskProperty.description}
      type={taskProperty.type}
      items={taskProperty.items}
      value={taskArgumentsValues[taskProperty.key]}
      defaultValue={taskProperty.default}
      on:argumentUpdated={taskArgumentValueUpdated}
    />

  {/each}

</div>


