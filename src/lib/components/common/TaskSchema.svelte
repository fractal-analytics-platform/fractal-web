<script>
	import TaskArgument from '$lib/components/common/TaskArgument.svelte';

	// const jsonTaskSchema = '{"title": "TaskArguments", "type": "object", "properties": {"a": {"title": "A", "description": "This is the description of argument a", "default": 0, "type": "integer"}, "obj1": {"$ref": "#/definitions/Argument"}, "obj2": {"$ref": "#/definitions/Argument"}, "obj3": {"title": "Obj3", "description": "A custom object schema", "allOf": [{"$ref": "#/definitions/Argument"}]}}, "required": ["obj2", "obj3"], "definitions": {"Argument": {"title": "Argument", "type": "object", "properties": {"a": {"title": "A", "description": "A integer property of an object", "default": 3, "type": "integer"}, "b": {"title": "B", "description": "A string property of an object", "default": "hello", "type": "string"}, "c": {"title": "C", "type": "boolean"}, "d": {"title": "D", "default": [1, 2, 3], "type": "array", "items": {"type": "integer"}}}, "required": ["c"]}}}\n';
	const jsonTaskSchema = '{"title": "TaskArguments", "type": "object", "properties": {"input_paths": {"title": "Input Paths", "description": "This is the arg description", "type": "array", "default": ["/tmp", "/tmp2"], "items": {"type": "string"}}, "output_path": {"title": "Output Path", "type": "string"}, "component": {"title": "Component", "type": "string"}}, "required": ["input_paths", "output_path", "metadata", "component"], "additionalProperties": false}'
	// const jsonTaskSchema = '{"title": "TaskArguments", "type": "object", "properties": {"input_paths": {"title": "Input Paths", "type": "array", "items": {"type": "string"}}, "output_path": {"title": "Output Path", "type": "string"}, "component": {"title": "Component", "type": "string"}, "channel_label": {"title": "Channel Label", "type": "string"}, "channel_label_c2": {"title": "Channel Label C2", "type": "string"}, "wavelength_id": {"title": "Wavelength Id", "type": "string"}, "wavelength_id_c2": {"title": "Wavelength Id C2", "type": "string"}, "level": {"title": "Level", "type": "integer"}, "relabeling": {"title": "Relabeling", "default": true, "type": "boolean"}, "input_ROI_table": {"title": "Input Roi Table", "type": "string"}, "output_ROI_table": {"title": "Output Roi Table", "type": "string"}, "output_label_name": {"title": "Output Label Name", "type": "string"}, "use_gpu": {"title": "Use Gpu", "type": "boolean"}, "anisotropy": {"title": "Anisotropy", "type": "number"}, "diameter_level0": {"title": "Diameter Level0", "type": "number"}, "cellprob_threshold": {"title": "Cellprob Threshold", "type": "number"}, "flow_threshold": {"title": "Flow Threshold", "type": "number"}, "model_type": {"title": "Model Type", "type": "string"}, "pretrained_model": {"title": "Pretrained Model", "type": "string"}, "min_size": {"title": "Min Size", "type": "integer"}, "augment": {"title": "Augment", "type": "boolean"}, "net_avg": {"title": "Net Avg", "type": "boolean"}, "use_masks": {"title": "Use Masks", "type": "boolean"}}, "required": ["input_paths", "output_path", "component", "metadata", "level"], "additionalProperties": false}'
	// const jsonTaskSchema = '{"title": "TaskArguments", "type": "object", "properties": {"input_paths": {"title": "Input Paths", "description": "TBD", "type": "array", "default": ["/tmp1", "/tmp2"], "items": {"type": "string"}}, "output_path": {"title": "Output Path", "description": "TBD", "type": "string"}, "image_extension": {"title": "Image Extension", "default": "tif", "type": "string"}, "image_glob_patterns": {"title": "Image Glob Patterns", "description": "TBD", "type": "array", "items": {"type": "string"}}, "allowed_channels": {"title": "Allowed Channels", "type": "array", "items": {"type": "object"}}, "num_levels": {"title": "Num Levels", "description": "TBD", "default": 2, "type": "integer"}, "coarsening_xy": {"title": "Coarsening Xy", "description": "TBD", "default": 2, "type": "integer"}, "metadata_table": {"title": "Metadata Table", "description": "TBD", "default": "mrf_mlf", "type": "string"}}, "required": ["input_paths", "output_path", "metadata", "allowed_channels"], "additionalProperties": false}'
	// const jsonTaskSchema = '{"title": "TaskArguments", "type": "object", "properties": {"a": {"title": "A", "description": "This is the description of argument a", "default": 0, "type": "integer"}, "b": {"title": "B", "type": "string"}, "c": {"title": "C", "description": "A boolean field", "default": true, "type": "boolean"}, "d": {"title": "D", "description": "A list of numbers", "default": [0, 1, 2], "type": "array", "items": {"type": "integer"}}, "e": {"title": "E", "description": "A list of strings", "default": ["hello", "this", "test"], "type": "array", "items": {"type": "string"}}, "f": {"title": "F", "description": "A list of bools", "default": [true, false, false], "type": "array", "items": {"type": "boolean"}}, "g": {"title": "G", "description": "A nested list of integers", "default": [[1, 2], [3, 4], [5], [6]], "type": "array", "items": {"type": "array", "items": {"type": "integer"}}}, "h": {"title": "H", "description": "A nested list of strings", "default": [["this", "is"], ["a", "list"], ["of"], ["strings"]], "type": "array", "items": {"type": "array", "items": {"type": "string"}}}, "i": {"title": "I", "description": "A nested list of bools", "type": "array", "items": {"type": "array", "items": {"type": "boolean"}}}, "l": {"title": "L", "description": "An infinite nesting of lists", "default": [[[0]]], "type": "array", "items": {"type": "array", "items": {"type": "array", "items": {"type": "integer"}}}}, "obj1": {"$ref": "#/definitions/Argument"}, "obj2": {"$ref": "#/definitions/Argument"}, "obj3": {"title": "Obj3", "description": "A custom object schema", "allOf": [{"$ref": "#/definitions/Argument"}]}}, "required": ["i", "obj2", "obj3"], "definitions": {"Argument": {"title": "Argument", "type": "object", "properties": {"a": {"title": "A", "description": "A integer property of an object", "default": 3, "type": "integer"}, "b": {"title": "B", "description": "A string property of an object", "default": "hello", "type": "string"}, "c": {"title": "C", "type": "boolean"}, "d": {"title": "D", "default": [1, 2, 3], "type": "array", "items": {"type": "integer"}}}, "required": ["c"]}}}'
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


