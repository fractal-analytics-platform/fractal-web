<script>
	import SlimSelect from 'slim-select';
	import { onDestroy, onMount } from 'svelte';

	/** @type {{ key: string, value: string[], type: string, error: string }} */
	export let field;
	/** @type {string[]} */
	export let selectableAttributeKeys;
	/** @type {{ [key: string]: Array<string | number | boolean> }} */
	export let existingAttributes;
	/** @type {number} */
	export let index;

	/** @type {SlimSelect|undefined} */
	let valueSelector;

	/**
	 */
	async function onFieldKeySelected() {
		if (!field.key) {
			valueSelector?.setSelected('Select...');
			return;
		}
		initSelector();
	}

	onMount(() => {
		if (field.key) {
			initSelector();
			valueSelector?.setSelected(field.value);
		}
	});

	onDestroy(() => {
		valueSelector?.destroy();
	});

	function initSelector() {
		const elementId = `attributeValue-${index}`;
		const selectElement = document.getElementById(elementId);
		if (!selectElement) {
			console.error(`Element ${elementId} not found`);
			return;
		}
		const values = existingAttributes[field.key];
		if (values.length > 0) {
			field.type = typeof values[0];
		}
		selectElement.classList.remove('invisible');
		selectElement.setAttribute('multiple', 'multiple');
		valueSelector = new SlimSelect({
			select: `#${elementId}`,
			settings: {
				showSearch: true,
				allowDeselect: true,
				isMultiple: true,
				ariaLabel: 'Value'
			},
			events: {
				afterChange: (selection) => {
					field.value = selection.map((s) => s.value);
				}
			}
		});
		const allowedValues = existingAttributes[field.key];
		valueSelector.setData([
			{ text: 'Select...', placeholder: true },
			...allowedValues.map((v) => ({ text: v.toString(), value: v.toString() }))
		]);
	}
</script>

{#if field.key}
	<select
		class="form-select form-select-sm attribute-key"
		bind:value={field.key}
		class:is-invalid={field.error}
		disabled={true}
	>
		<option>{field.key}</option>
	</select>
{:else}
	<select
		class="form-select form-select-sm attribute-key"
		bind:value={field.key}
		class:is-invalid={field.error}
		on:change={onFieldKeySelected}
	>
		<option value="">Select...</option>
		{#each selectableAttributeKeys as key}
			<option>{key}</option>
		{/each}
	</select>
{/if}

<span class="input-group-text pt-0 pb-0 flex-grow-1">
	<select id="attributeValue-{index}" class="invisible" />
</span>
