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
	import { createEventDispatcher, onMount } from 'svelte';
	import TaskSchemaProperty from '$lib/components/common/TaskSchemaProperty.svelte';

	// Another json validator
	const ajv = new Ajv({ useDefaults: true });

	// Dispatcher
	const dispatcher = new createEventDispatcher();

	// General properties
	let errorMessage = undefined;
	let propertyChanged = false;
	let schemaProperties = [];

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
			try {
				taskSchema = JSON.parse(taskSchema);
				compileAjvSchema();
			} catch {
				errorMessage = 'The given schema is not a valid JSON string';
				console.error(errorMessage);
			}
		}
	}

	onMount(() => {
		console.log('Schema is valid?', validSchema);
		if (validSchema) {
			// Validate the value object against the schema
			// argsValues is the given value object
			const argsValid = compiledSchema(argsValues);
			if (!argsValid) {
				errorMessage = 'The argument values do not respect the task schema:';
				compiledSchema.errors.forEach(error => {
					errorMessage += '\n\t - ' + error.message + ' | ' + error.schemaPath;
				});
			}


			for (const [key, value] of Object.entries(taskSchema.properties)) {
				schemaProperties.push({
					key: key,
					schema: value,
					value: argsValues[key]
				});
			}
		}
	});

	console.debug('Default values', argsValues);

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

      <button class='btn btn-success {propertyChanged ? "" : "disabled"}'
              on:click|preventDefault={() => {console.log(schemaProperties)}}>Update
      </button>
    </div>

    {#each schemaProperties as schemaProperty}
      <TaskSchemaProperty
        referenceSchema={taskSchema}
        schemaPropertyKey={schemaProperty.key}
        bind:schemaProperty={schemaProperty.schema}
        bind:propertyValue={schemaProperty.value}
        on:propertyChanged={() => { propertyChanged = true }}
      />

    {/each}
  </div>

{/if}