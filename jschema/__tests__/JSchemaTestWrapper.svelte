<script>
	import JSchema from '../src/lib/components/JSchema.svelte';

	/** @type {any} */
	export let schema;
	/** @type {any} */
	export let schemaData;
	/** @type {(data: any) => void} */
	export let onChange = function () {};

	/** @type {JSchema} */
	let jschema;

	export function getArguments() {
		return jschema.getArguments();
	}

	export let unsavedChanges = false;

	/**
	 * @param {any} data
	 */
	function innerOnChange(data) {
		unsavedChanges = true;
		onChange(data.detail.value);
	}
</script>

<JSchema componentId="test" bind:this={jschema} {schema} {schemaData} on:change={innerOnChange} />
