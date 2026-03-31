<script>
	import PropertyDescription from "fractal-components/jschema/properties/PropertyDescription.svelte";
	import { onMount } from "svelte";

    /**
	 * @typedef {Object} Props
	 * @property {number} templateId
	 */

	/** @type {Props} */
	let { templateId } = $props();

    /** @type {string|undefined} */
    let description = $state();

    onMount(async () => {
		const response = await fetch(`/api/v2/workflow-template/${templateId}`);
		const template = await response.json();
		description = template["description"];
	});
</script>

{#if description}
    <PropertyDescription {description} html={true}/>
{/if}