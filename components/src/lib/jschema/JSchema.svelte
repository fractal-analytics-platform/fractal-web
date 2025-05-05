<script>
	import { run } from 'svelte/legacy';

	import { createEventDispatcher, onMount } from 'svelte';
	import { FormManager } from './form_manager.js';
	import ObjectProperty from './properties/ObjectProperty.svelte';

	/** @type {(type: string, detail?: any) => boolean} */
	const dispatch = createEventDispatcher();

	
	
	
	
	
	/**
	 * @typedef {Object} Props
	 * @property {object} schema
	 * @property {object} schemaData
	 * @property {'pydantic_v1'|'pydantic_v2'} schemaVersion
	 * @property {string[]} [propertiesToIgnore]
	 * @property {string} componentId
	 * @property {boolean} [editable]
	 */

	/** @type {Props} */
	let {
		schema,
		schemaData,
		schemaVersion,
		propertiesToIgnore = [],
		componentId,
		editable = true
	} = $props();

	/** @type {FormManager|undefined} */
	let formManager = $state();
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
	run(() => {
		if (schema || schemaData || propertiesToIgnore) {
			initFormManager();
		}
	});
</script>

{#if formManager}
	{#key formManager}
		<div id={componentId}>
			<ObjectProperty formElement={formManager.root} isRoot={true} {editable} />
		</div>
	{/key}
{/if}
