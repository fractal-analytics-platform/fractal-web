<script>
	import { FormManager } from './form_manager.js';
	import ObjectProperty from './properties/ObjectProperty.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {'pydantic_v1'|'pydantic_v2'} schemaVersion
	 * @property {string[]} [propertiesToIgnore]
	 * @property {string} componentId
	 * @property {boolean} [editable]
	 * @property {(data: any, valid: boolean, errors: string[]) => void} onchange
	 */

	/** @type {Props} */
	let { schemaVersion, propertiesToIgnore = [], componentId, editable = true, onchange } = $props();

	/** @type {FormManager|undefined} */
	let formManager = $state();

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

	/**
	 * @param {any} schema
	 * @param {any}  schemaData
	 */
	function initFormManager(schema, schemaData = undefined) {
		if (schema) {
			try {
				formManager = new FormManager(
					schema,
					onchange,
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

	/**
	 * @param {any} schema
	 * @param {any}  schemaData
	 */
	export function update(schema, schemaData = undefined) {
		initFormManager(schema, schemaData);
	}
</script>

{#if formManager}
	{#key formManager}
		<div id={componentId}>
			<ObjectProperty formElement={formManager.root} isRoot={true} {editable} />
		</div>
	{/key}
{/if}
