<script>
	/**
	 * This component should take as an input a JSON Schema object and an object with given values
	 * The value object would be validated against the schema.
	 * If the value object is undefined or has not been set, a default value object from the schema
	 * will be used instead.
	 * Every edit to the value object, through forms, will be validated against the given schema.
	 *
	 * If this component does not recognize a valid json schema, an error should be thrown.
	 * If this component is not able to render a meaningful interface for the user, an error should
	 * be used as a feedback. The client should be able to redirect the user to a meaningful page.
	 *
	 *
	 * The rendering of this component should proceed as described:
	 * - Take a json schema
	 * - Take a value object
	 * - Validate the json schema
	 * - Validate the value object against the schema; consider set default values;
	 * - Render the page structure through iteration with json-schema-traverse
	 * - Await user inputs and edits
	 * - React to inputs and validate the updated value object against the json schema
	 * - If the updated value object is valid, emit an event with the updated value object
	 * - If the updated value object is not valid, display an error feedback in the interface.
	 *
	 */

	import Ajv from 'ajv';
	import { createEventDispatcher } from 'svelte';
	import TaskSchemaProperty from '$lib/components/common/TaskSchemaProperty.svelte';

	// Another json validator
	const ajv = new Ajv({ useDefaults: true });

	// Dispatcher
	const dispatcher = new createEventDispatcher();

	// General properties
	let errorMessage = undefined;

	// The json schema, should either be a valid json schema or a string to be parsed as json schema
	export let taskSchema = undefined;
	let compiledSchema = undefined;
	let validSchema = false;

	// The value object
	export let argsValues = undefined;


	// Compile Ajv schema and set an ajv instance within compiledSchema
	const compileAjvSchema = function() {
		try {
			compiledSchema = ajv.compile(taskSchema);
			validSchema = true;
		} catch {
			errorMessage = 'The given schema is invalid';
			console.error(errorMessage);
		}
	};

	if (taskSchema === undefined) {
		// taskSchema could not be undefined - that is an error
		errorMessage = 'Task schema object could not be undefined';
		console.error(errorMessage);
	} else {
		// Validate the taskSchema
		if (typeof taskSchema === 'object') {
			// The task schema is a valid object, validate it
			compileAjvSchema();
		}

		if (typeof taskSchema === 'string') {
			taskSchema = JSON.parse(taskSchema);
			compileAjvSchema();
		}
	}

	// Validate the value object against the schema
	// argsValues is the given value object
	const argsValid = compiledSchema(argsValues);
	if (!argsValid) {
		errorMessage = 'The argument values do not respect the task schema:';
		compiledSchema.errors.forEach(error => {
			errorMessage += '\n\t - ' + error.message + ' | ' + error.schemaPath;
		});
	}

	console.log('Default values', argsValues);


	// By traversing the schema, the component should build its reference objects
	// Those objects will be used as a reference to render UI components and their data
	// Let's use json-schema-traverse
	/* traverse(taskSchema, {}, (currentSchema, path, rootSchema, parentPath, parentKeyword, parentSchema, keyIndex) => {
    if (!path.includes('properties') || path.includes('definitions')) return
    if (keyIndex !== undefined && typeof keyIndex !== 'number') {
      // console.log(parentPath, parentKeyword)
      // console.log(path, keyIndex)
      // console.log(currentSchema)
    }
  }) */

	// Internal object that keeps track of each value of each task argument based on the given schema
	/* const taskArgumentsValues = {};
	// TODO: Check if a given argsValues object is given
	// If argsValues is not undefined, taskArgumentsValues should set its starting properties by
	// merging with the ones from argsValues
	if (argsValues !== undefined) {
		// console.log(argsValues);
		Object.keys(argsValues).forEach(key => {
			taskArgumentsValues[key] = argsValues[key];
		});
	} */

	// The code to build an iterable argumentSchema
	/* function buildIterableArgumentSchema() {
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
      // If taskArgumentsValues[key] is undefined, then set to default schema value
      // If taskArgumentsValues[key] is undefined, it means that there is no value coming from server
      if (taskArgumentsValues[key] === undefined) {
        taskArgumentsValues[key] = schemaProperties[key].default;
      }
    }

    return taskArgumentsSchema;
  } */

	// console.log(taskArgumentsValues);

	function taskArgumentValueUpdated(event) {
		console.debug('The task argument has updated', event.detail.schemaPropertyKey, event.detail.propertyValue);
		console.log(schemaProperties);
		// taskArgumentsValues[event.detail.key] = event.detail.value;
		// console.debug(taskArgumentsValues);
		// dispatcher('argumentsUpdated', taskArgumentsValues);
	}

	let schemaProperties = [];
	for (const [key, value] of Object.entries(taskSchema.properties)) {
		schemaProperties.push({
			key: key,
			schema: value,
			value: argsValues[key]
		});
	}

</script>

{#if validSchema === false}

  <pre>
    <p class='alert alert-danger'>
      {errorMessage}
    </p>
  </pre>

{:else}

  <div class='card'>
    <div class='card-header'>
      Task Schema
    </div>

    {#each schemaProperties as schemaProperty}
      <TaskSchemaProperty
        referenceSchema={taskSchema}
        schemaPropertyKey={schemaProperty.key}
        bind:schemaProperty={schemaProperty.schema}
        bind:propertyValue={schemaProperty.value}
        on:argumentUpdated={taskArgumentValueUpdated}
      />

    {/each}
  </div>

{/if}