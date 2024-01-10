<script>
	import SchemaInput from '$lib/components/common/jschema/SchemaInput.svelte';
	import JSchema from '$lib/components/common/jschema/JSchema.svelte';

	let schema = undefined;
	let schemaData = undefined;

	let jsonSchema = '{"title": "TaskArguments", "type": "object", "properties": {"a": {"title": "A", "description": "This is the description of argument a", "default": 0, "type": "integer"}, "b": {"title": "B", "type": "string"}, "c": {"title": "C", "description": "A boolean field", "default": true, "type": "boolean"}, "d": {"title": "D", "description": "A list of numbers", "default": [0, 1, 2], "type": "array", "items": {"type": "integer"}}, "e": {"title": "E", "description": "A list of strings", "default": ["hello", "this", "test"], "type": "array", "items": {"type": "string"}}, "f": {"title": "F", "description": "A list of bools", "default": [true, false, false], "type": "array", "items": {"type": "boolean"}}, "g": {"title": "G", "description": "A nested list of integers", "default": [[1, 2], [3, 4], [5], [6]], "type": "array", "items": {"type": "array", "items": {"type": "integer"}}}, "h": {"title": "H", "description": "A nested list of strings", "default": [["this", "is"], ["a", "list"], ["of"], ["strings"]], "type": "array", "items": {"type": "array", "items": {"type": "string"}}}, "i": {"title": "I", "description": "A nested list of bools", "type": "array", "items": {"type": "array", "items": {"type": "boolean"}}}, "l": {"title": "L", "description": "An infinite nesting of lists", "default": [[[0]]], "type": "array", "items": {"type": "array", "items": {"type": "array", "items": {"type": "integer"}}}}, "m": {"title": "M", "description": "An infinite nesting of lists", "default": [[[0]]], "type": "array", "items": {"type": "array", "items": {"type": "array", "items": {"$ref": "#/definitions/Argument"}}}}, "n": {"title": "N", "type": "array", "items": {"type": "array", "items": {"type": "array", "items": {"$ref": "#/definitions/Argument"}}}}, "obj1": {"$ref": "#/definitions/Argument"}, "obj2": {"$ref": "#/definitions/Argument"}, "obj3": {"title": "Obj3", "description": "A custom object schema", "allOf": [{"$ref": "#/definitions/Argument"}]}, "obj4": {"title": "Obj4", "description": "A list of arguments", "default": [], "type": "array", "items": {"$ref": "#/definitions/Argument"}}}, "required": ["i", "n", "obj2", "obj3"], "definitions": {"SubArgument": {"title": "SubArgument", "type": "object", "properties": {"subA": {"title": "Suba", "description": "A sub argument property", "default": 0, "type": "integer"}}}, "Argument": {"title": "Argument", "type": "object", "properties": {"a": {"title": "A", "description": "A integer property of an object", "default": 3, "type": "integer"}, "b": {"title": "B", "description": "A string property of an object", "default": "hello", "type": "string"}, "c": {"title": "C", "type": "boolean"}, "d": {"title": "D", "default": [1, 2, 3], "type": "array", "items": {"type": "integer"}}, "e": {"$ref": "#/definitions/SubArgument"}}, "required": ["c", "e"]}}}';
	jsonSchema = '';

</script>

<h1 class="fw-light">Sandbox page for jsonschema</h1>

<SchemaInput {jsonSchema} bind:parsedSchema={schema} bind:parsedData={schemaData}></SchemaInput>

<JSchema
  {schema}
  {schemaData}
></JSchema>
