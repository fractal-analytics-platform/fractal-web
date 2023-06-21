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
	 * - Await user inputs and edits
	 * - React to inputs and validate the updated value object against the json schema
	 * - If the updated value object is valid, emit an event with the updated value object
	 * - If the updated value object is not valid, display an error feedback in the interface.
	 *
	 */

	import { onMount, setContext } from 'svelte';
	import SchemaManager, {
		stripSchemaProperties,
		stripNullAndEmptyObjectsAndArrays
	} from '$lib/components/common/jschema/schema_management.js';
	import { SchemaValidator } from '$lib/common/jschema_validation.js';
	import PropertiesBlock from '$lib/components/common/jschema/PropertiesBlock.svelte';

	const validator = new SchemaValidator();
	export let schema = undefined;
	export let schemaData = undefined;
	export let handleSaveChanges = undefined;
	export let handleValidationErrors = undefined;

	let parsedSchema = undefined;
	let isSchemaValid = undefined;
	let isDataValid = undefined;

	let schemaManager = undefined;
	export let unsavedChanges = false;

	onMount(() => {
		// Load a default schema
		if (schema !== undefined) {
			stripSchemaProperties(schema);
			parsedSchema = schema;
		}

		// Load schema and data from server
		// Validate schema
		if (isSchemaValid && isDataValid) {
			// Create component structures
			// Setup svelte context
			// Add event listeners
		}
	});

	$: {
		if (schema !== undefined) {
			stripSchemaProperties(schema);
			parsedSchema = schema;
			isSchemaValid = validator.loadSchema(parsedSchema);
			console.log('Validator loaded schema. Is valid schema?', isSchemaValid);
		}
	}

	$: {
		if (schemaData !== undefined) {
			// Check if schema data is null
			if (schemaData === null) schemaData = {};
			isDataValid = validator.isValid(schemaData);
			console.log('Validator loaded data. Errors?', validator.getErrors());
		}
	}

	$: {
		if (schema && schemaData) {
			initializeSchemaContext();
		}
	}

	function initializeSchemaContext() {
		if (parsedSchema !== undefined && isSchemaValid && isDataValid !== undefined) {
			schemaManager = new SchemaManager(parsedSchema, schemaData);
			setContext('schemaManager', schemaManager);
			schemaManager.onPropertyChanges = (hasChanges) => {
				unsavedChanges = hasChanges;
			};
		}
	}

	export function saveChanges() {
		const data = schemaManager.data;
		// The following is required to remove all null values from the data object
		// We suppose that null values are not valid, hence we remove them
		const strippedNullData = stripNullAndEmptyObjectsAndArrays(data);
		const isDataValid = validator.isValid(strippedNullData);
		if (!isDataValid) {
			if (handleValidationErrors !== null && handleValidationErrors !== undefined) {
				handleValidationErrors(validator.getErrors());
			}
			console.error('Could not save changes. Data is invalid', validator.getErrors());
			return;
		}

		if (handleSaveChanges !== null && handleSaveChanges !== undefined) {
			handleSaveChanges(strippedNullData)
				.then(() => {
					schemaManager.changesSaved();
				})
				.catch((err) => {
					console.error(err);
				});
		}
	}

	export function resetChanges(args) {
		// Set schemaData to incoming args value
		schemaData = args;
		// Mark changes as unsaved
		unsavedChanges = true;
	}


</script>

{#if parsedSchema !== undefined && isSchemaValid && isDataValid !== undefined}

  <!-- Start rendering the schema structure -->
  <div id='json-schema'>
    {#key schemaManager}
      <PropertiesBlock
        properties={parsedSchema.properties}
      />
    {/key}
  </div>

{:else if parsedSchema === undefined}

  <div>
    <p>Loading schema</p>
  </div>

{:else if !isSchemaValid}

  <div class='alert alert-danger'>
    <p>Invalid schema or undefined parsed schema</p>
    <p>Something is wrong</p>
  </div>

{:else if !isDataValid && schemaData !== undefined}


  <div class='alert alert-danger'>
    <div>Data object is invalid</div>
    <div>Something is wrong</div>
  </div>

{:else if schemaData === undefined}

  <div class='alert alert-warning'>
    <span>Data object is missing</span>
  </div>

{/if}
