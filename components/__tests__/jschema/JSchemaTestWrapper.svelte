<script>
	import { onMount } from 'svelte';
	import JSchema from '../../src/lib/jschema/JSchema.svelte';

	/** @type {any} */
	export let schema;
	/** @type {any} */
	export let schemaData;
	/** @type {'pydantic_v1'|'pydantic_v2'} */
	export let schemaVersion;
	/** @type {(data: any) => void} */
	export let onChange = function () {};
	/** @type {boolean|undefined} */
	export let valid;

	/** @type {JSchema} */
	let jschema;

	export function getArguments() {
		return jschema.getArguments();
	}

	export let unsavedChanges = false;

	/**
	 * @param {any} data
	 */
	function innerOnChange(data, isValid) {
		if (schemaData !== undefined && JSON.stringify(schemaData) !== JSON.stringify(data)) {
			unsavedChanges = true;
			onChange(data);
		}
		schemaData = data;
		valid = isValid;
	}

	onMount(() => {
		jschema.update(schema, schemaData);
	});
</script>

<JSchema componentId="test" bind:this={jschema} {schemaVersion} onchange={innerOnChange} />
