<script>
	import { FormManager } from './form_manager.js';
	import ObjectProperty from './properties/ObjectProperty.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {'pydantic_v1'|'pydantic_v2'} schemaVersion
	 * @property {string[]} [propertiesToIgnore]
	 * @property {string} componentId
	 * @property {boolean} [editable]
	 * @property {(data: any, valid: boolean) => void} onchange
	 * @property {boolean} dataValid
	 */

	/** @type {Props} */
	let {
		schemaVersion,
		propertiesToIgnore = [],
		componentId,
		editable = true,
		onchange,
		dataValid = $bindable()
	} = $props();

	/** @type {FormManager|undefined} */
	let formManager = $state();
	/** @type {string[]} */
	let genericErrors = $state([]);

	export function getArguments() {
		return formManager?.getFormData();
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
				formManager.genericErrors.subscribe((e) => (genericErrors = e));
				formManager.dataValid.subscribe((v) => (dataValid = v));
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
		{#each genericErrors as error, index (index)}
			<div class="alert alert-danger mt-1"><pre>{error}</pre></div>
		{/each}
		<div id={componentId}>
			<ObjectProperty formElement={formManager.root} isRoot={true} {editable} />
		</div>
	{/key}
{/if}
