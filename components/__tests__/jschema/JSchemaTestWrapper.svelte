<script>
	import { onMount } from 'svelte';
	import JSchema from '../../src/lib/jschema/JSchema.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {any} schema
	 * @property {any} schemaData
	 * @property {'pydantic_v1'|'pydantic_v2'} schemaVersion
	 * @property {(data: any) => void} onChange
	 * @property {boolean} valid
	 * @property {boolean} unsavedChanges
	 */

	/** @type {Props} */
	let { schema, schemaData, schemaVersion, onChange, valid, unsavedChanges = false } = $props();

	/** @type {JSchema} */
	let jschema;

	export function getArguments() {
		return jschema.getArguments();
	}

	export const hasUnsavedChanges = () => unsavedChanges;
	export const isValid = () => valid;

	/**
	 * @param {any} data
	 */
	function innerOnChange(data) {
		if (schemaData !== undefined && JSON.stringify(schemaData) !== JSON.stringify(data)) {
			unsavedChanges = true;
			onChange(data);
		}
		schemaData = data;
	}

	onMount(() => {
		jschema.update(schema, schemaData);
	});
</script>

<JSchema
	componentId="test"
	bind:this={jschema}
	{schemaVersion}
	onchange={innerOnChange}
	bind:dataValid={valid}
/>
