<script>
	import { onMount, setContext } from 'svelte';
	import PropertiesBlock from '$lib/components/common/jschema/PropertiesBlock.svelte';

	let valid = false;
	let validatedSchema = undefined;
	let data = undefined;

	// Define context
	setContext('jsonSchema', {
		getSchema: () => validatedSchema,
		getValue: (key) => {
			const keys = key.split('.');
			let value = data;
			keys.forEach(k => {
				// Unless value is undefined, set value to value[k]
				if (value !== undefined)
					value = value[k];
			});
			return value;
		}
	});

	onMount(() => {
		// Load schema and data from server
		let schema = '{"title": "TaskArguments", "type": "object", "properties": {"a": {"title": "A", "description": "This is the description of argument a", "default": 0, "type": "integer"}, "b": {"title": "B", "type": "string"}, "c": {"title": "C", "description": "A boolean field", "default": true, "type": "boolean"}, "d": {"title": "D", "description": "A list of numbers", "default": [0, 1, 2], "type": "array", "items": {"type": "integer"}}, "e": {"title": "E", "description": "A list of strings", "default": ["hello", "this", "test"], "type": "array", "items": {"type": "string"}}, "f": {"title": "F", "description": "A list of bools", "default": [true, false, false], "type": "array", "items": {"type": "boolean"}}, "g": {"title": "G", "description": "A nested list of integers", "default": [[1, 2], [3, 4], [5], [6]], "type": "array", "items": {"type": "array", "items": {"type": "integer"}}}, "h": {"title": "H", "description": "A nested list of strings", "default": [["this", "is"], ["a", "list"], ["of"], ["strings"]], "type": "array", "items": {"type": "array", "items": {"type": "string"}}}, "i": {"title": "I", "description": "A nested list of bools", "type": "array", "items": {"type": "array", "items": {"type": "boolean"}}}, "l": {"title": "L", "description": "An infinite nesting of lists", "default": [[[0]]], "type": "array", "items": {"type": "array", "items": {"type": "array", "items": {"type": "integer"}}}}, "m": {"title": "M", "description": "An infinite nesting of lists", "default": [[[0]]], "type": "array", "items": {"type": "array", "items": {"type": "array", "items": {"$ref": "#/definitions/Argument"}}}}, "n": {"title": "N", "type": "array", "items": {"type": "array", "items": {"type": "array", "items": {"$ref": "#/definitions/Argument"}}}}, "obj1": {"$ref": "#/definitions/Argument"}, "obj2": {"$ref": "#/definitions/Argument"}, "obj3": {"title": "Obj3", "description": "A custom object schema", "allOf": [{"$ref": "#/definitions/Argument"}]}, "obj4": {"title": "Obj4", "description": "A list of arguments", "default": [], "type": "array", "items": {"$ref": "#/definitions/Argument"}}}, "required": ["i", "n", "obj2", "obj3"], "definitions": {"SubArgument": {"title": "SubArgument", "type": "object", "properties": {"subA": {"title": "Suba", "description": "A sub argument property", "default": 0, "type": "integer"}}}, "Argument": {"title": "Argument", "type": "object", "properties": {"a": {"title": "A", "description": "A integer property of an object", "default": 3, "type": "integer"}, "b": {"title": "B", "description": "A string property of an object", "default": "hello", "type": "string"}, "c": {"title": "C", "type": "boolean"}, "d": {"title": "D", "default": [1, 2, 3], "type": "array", "items": {"type": "integer"}}, "e": {"$ref": "#/definitions/SubArgument"}}, "required": ["c", "e"]}}}';
		data = {
			a: 1,
			e: ['hello'],
			d: [1, 2, 3, 4],
			obj1: {
				d: [1, 2],
				subA: {
					a: 1
				}
			}
		};
		validatedSchema = JSON.parse(schema);
		valid = true;
		// Validate schema
		if (valid) {
			// Create component structures
			// Setup svelte context
			// Add event listeners
		}

	});


</script>

{#if valid && validatedSchema !== undefined}

  <!-- Start rendering the schema structure -->

  <div id='json-schema'>
    <PropertiesBlock
      properties={validatedSchema.properties}
    />
  </div>

{:else}

  <div>
    <p>Invalid schema or undefined parsed schema</p>
    <p>Something is wrong</p>
  </div>


{/if}
