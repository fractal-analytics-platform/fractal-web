<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { FormManager } from './form_manager.js';
	import ObjectProperty from './properties/ObjectProperty.svelte';

	/** @type {(type: string, detail?: any) => boolean} */
	const dispatch = createEventDispatcher();

	/** @type {object} */
	export let schema;
	/** @type {object} */
	export let schemaData;
	/** @type {'pydantic_v1'|'pydantic_v2'} */
	export let schemaVersion;
	/** @type {string[]} */
	export let propertiesToIgnore = [];
	/** @type {string} */
	export let componentId;
	export let editable = true;

	/** @type {FormManager|undefined} */
	let formManager;
	onMount(() => {
		initFormManager();
	});

	export function getArguments() {
		return formManager?.getFormData();
	}

	export function validateArguments() {
		// Trigger validation on input fields
		for (const field of document.querySelectorAll(
			`#${componentId} input, #${componentId} select`
		)) {
			field.dispatchEvent(new Event('input'));
		}
		formManager?.validate();
	}

	$: {
		if (schema || schemaData || propertiesToIgnore) {
			initFormManager();
		}
	}

	function initFormManager() {
		if (schema) {
			try {
				formManager = new FormManager(
					schema,
					dispatch,
					schemaVersion,
					propertiesToIgnore,
					schemaData
				);
			} catch (err) {
				console.error(err);
				formManager = undefined;
			}
		} else {
			formManager = undefined;
		}
	}
</script>

{#if formManager}
	{#key formManager}
		<div id={componentId}>
			<ObjectProperty formElement={formManager.root} isRoot={true} {editable} />
		</div>
	{/key}
{/if}
