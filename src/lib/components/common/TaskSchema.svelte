<script>
	import TaskArgument from '$lib/components/common/TaskArgument.svelte';

	const jsonTaskSchema = '{"title": "TaskArguments", "type": "object", "properties": {"a": {"title": "A", "description": "This is the description of argument a", "default": 0, "type": "integer"}, "obj1": {"$ref": "#/definitions/Argument"}, "obj2": {"$ref": "#/definitions/Argument"}, "obj3": {"title": "Obj3", "description": "A custom object schema", "allOf": [{"$ref": "#/definitions/Argument"}]}}, "required": ["obj2", "obj3"], "definitions": {"Argument": {"title": "Argument", "type": "object", "properties": {"a": {"title": "A", "description": "A integer property of an object", "default": 3, "type": "integer"}, "b": {"title": "B", "description": "A string property of an object", "default": "hello", "type": "string"}, "c": {"title": "C", "type": "boolean"}, "d": {"title": "D", "default": [1, 2, 3], "type": "array", "items": {"type": "integer"}}}, "required": ["c"]}}}\n';
	const parsedSchema = JSON.parse(jsonTaskSchema);

	const schemaProperties = parsedSchema.properties;
	const schemaDefinitions = parsedSchema.definitions;

	const taskArgumentsValues = {};
	const taskArgumentsSchema = [];
	for (const [key, propSchema] of Object.entries(schemaProperties)) {
		let taskArgumentSchema = {};
		// Should check whether this schema property has a reference value
		// The reference value could be nested within a 'allOf' key
		// Check allOf key presence
		const hasAllOf = Object.keys(schemaProperties[key]).includes('allOf');
		// Check that has a $ref key
		const hasRef = Object.keys(schemaProperties[key]).includes('$ref');

		if (hasAllOf || hasRef) {
			console.log('The schema property has an external definition');
			// Retrieve the schema definition
			if (hasAllOf) {
				// Get the definition reference from hasAllOf
				const defReference = schemaProperties[key]['allOf'][0]['$ref'];
				console.log(defReference);
				const definitionKey = defReference.split('/').pop(-1);
				console.log(definitionKey);
				console.log(schemaDefinitions[definitionKey]);
				const objectSchema = schemaDefinitions[definitionKey];
				taskArgumentSchema = propSchema;
				taskArgumentSchema.type = objectSchema.type;
				taskArgumentSchema.properties = objectSchema.properties;
			}

			if (hasRef) {
				// Get the definition reference from hasRef
				const defReference = schemaProperties[key]['$ref'];
				console.log(defReference);
				const definitionKey = defReference.split('/').pop(-1);
				console.log(definitionKey);
				console.log(schemaDefinitions[definitionKey]);
				const objectSchema = schemaDefinitions[definitionKey];
				taskArgumentSchema = propSchema;
				taskArgumentSchema.type = objectSchema.type;
				taskArgumentSchema.properties = objectSchema.properties;
			}

		} else {
			taskArgumentSchema = propSchema;
		}

		// Add the taskArgumentSchema to the list
		taskArgumentSchema.key = key;
		taskArgumentsSchema.push(taskArgumentSchema);
		taskArgumentsValues[key] = schemaProperties[key].default;

	}

	console.log(taskArgumentsValues);

	function taskArgumentValueUpdated(event) {
		console.debug('The task argument has updated', event.detail.key, event.detail.value);
		taskArgumentsValues[event.detail.key] = event.detail.value;
		console.debug(taskArgumentsValues);
	}

</script>

<div>

  {#each taskArgumentsSchema as taskSchema }

    <TaskArgument
      key={taskSchema.key}
      title={taskSchema.title}
      description={taskSchema.description}
      type={taskSchema.type}
      items={taskSchema.items}
      propertiesSchema={taskSchema.properties}
      bind:value={taskArgumentsValues[taskSchema.key]}
      defaultValue={taskSchema.default}
      on:argumentUpdated={taskArgumentValueUpdated}
    />

  {/each}

</div>


