<script>
	import { onMount } from 'svelte';

	export let jsonSchema = '';
	export let jsonData = '';

	export let parsedSchema = undefined;
	export let parsedData = undefined;


	onMount(() => {
		if (jsonSchema !== '') {
			try {
				parsedSchema = JSON.parse(jsonSchema);
			} catch (e) {
				console.error('Unable to parse json schema', e);
			}
		}
	});

	function handleJsonSchemaInput(event) {
		// Get the value of the input
		let value = event.target.value;

		// Try to parse the value as JSON
		try {
			parsedSchema = JSON.parse(value);
			// If the parsed schema is valid, set the validated schema
		} catch (e) {
			// If the parsed schema is invalid, set the validated schema to undefined
			console.error('Unable to parse json schema', e);
		}
	}

	function handleJsonDataInput(event) {
		// Get the value of the input
		const value = event.target.value;
		// Try to parse the value as JSON
		if (value === '') {
			jsonData = '';
			return;
		}
		try {
			parsedData = JSON.parse(value);
		} catch (e) {
			console.error(e);
		}
	}
</script>

<div>
  <h1>JSON Schema</h1>
  <p>This is a test page for the JSON Schema component</p>

  <div>
    <input class='form-control' type='text' placeholder='JSON Schema as JSON string' on:change={handleJsonSchemaInput}
           value={jsonSchema}>
    <input class='form-control' type='text' placeholder='Default JSON values as JSON string'
           on:change={handleJsonDataInput}>
  </div>
</div>

