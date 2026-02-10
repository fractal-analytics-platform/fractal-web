<script>
	import { onMount } from 'svelte';
	import FormEntry from './FormEntry.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {object} args
	 * @property {boolean} [unsavedChanges]
	 * @property {boolean} [editable]
	 * @property {(data: any) => void} [onChange]
	 * @property {boolean} [allowAddingProperty]
	 */

	/** @type {Props} */
	let {
		args,
		unsavedChanges = $bindable(false),
		editable = true,
		onChange = () => {},
		allowAddingProperty = true
	} = $props();

	/**
	 * @type {Array<import('../types/form').FormBuilderEntry>}
	 */
	let editableArgs = $state([]);
	let savedEditableArgs = $state('');
	/**
	 * Used to generate unique id in the form (needed for accordions).
	 */
	let counter = 0;

	onMount(() => {
		init(args);
	});

	/**
	 * @param {object} newArgs
	 */
	function init(newArgs) {
		if (Array.isArray(newArgs)) {
			editableArgs.push(buildEditableEntry(newArgs, null));
		} else {
			for (const [k, v] of Object.entries(newArgs || {})) {
				editableArgs.push(buildEditableEntry(v, k));
			}
		}
		triggerChanges();
		savedEditableArgs = JSON.stringify(editableArgs);
	}

	$effect(() => {
		unsavedChanges = savedEditableArgs !== JSON.stringify($state.snapshot(editableArgs));
	});

	/**
	 * @param {any} value
	 * @param {string|null} key
	 * @return {import('../types/form').FormBuilderEntry}
	 */
	function buildEditableEntry(value, key) {
		counter++;
		let entry = {
			id: `item-${counter}`,
			error: ''
		};
		if (Array.isArray(value)) {
			const children = [];
			for (const item of value) {
				children.push(buildEditableEntry(item, null));
			}
			entry.type = 'array';
			entry.children = children;
		} else if (typeof value === 'object') {
			const children = [];
			for (const [k, v] of Object.entries(value)) {
				children.push(buildEditableEntry(v, k));
			}
			entry.type = 'object';
			entry.children = children;
		} else {
			entry.type = typeof value;
			entry.value = value;
		}
		if (key !== null) {
			entry.key = key;
		}
		return /** @type {import('../types/form').FormBuilderEntry} */ (entry);
	}

	/**
	 * @param {Array<import('../types/form').FormBuilderEntry>} parent
	 * @param {boolean} hasKey
	 */
	function addProperty(parent, hasKey) {
		parent.push(buildEditableEntry('', hasKey ? '' : null));
		triggerChanges();
	}

	/**
	 * @param {Array<import('../types/form').FormBuilderEntry>} parent
	 * @param {number} index
	 */
	function removeProperty(parent, index) {
		parent.splice(index, 1);
		triggerChanges();
	}

	/**
	 * @param {Array<import('../types/form').FormBuilderEntry>} parent
	 * @param {number} index
	 * @param {string} type
	 */
	async function changeType(parent, index, type) {
		parent[index] = buildEditableEntry(
			getDefaultValue(type),
			'key' in parent[index] ? parent[index].key || '' : null
		);
		parent[index].type = /** @type {import('../types/form').FormBuilderEntryType} */ (type);
		triggerChanges();
	}

	/**
	 * @param {string} type
	 */
	function getDefaultValue(type) {
		switch (type) {
			case 'object':
				return {};
			case 'array':
				return [];
			case 'boolean':
				return true;
			default:
				return '';
		}
	}

	/**
	 * @returns {boolean}
	 */
	export function validateArguments() {
		cleanErrors(editableArgs);
		const errors = [];
		validate(editableArgs, errors);
		triggerChanges();
		return errors.length === 0;
	}

	/**
	 * @param {Array<import('../types/form').FormBuilderEntry>} values
	 */
	function cleanErrors(values) {
		for (const value of values) {
			value.error = '';
			if (value.type === 'object' || value.type === 'array') {
				cleanErrors(value.children);
			}
		}
	}

	/**
	 * @param {Array<import('../types/form').FormBuilderEntry>} values
	 * @param {Array<string>} errors
	 */
	function validate(values, errors) {
		const keys = [];
		for (const value of values) {
			if ('key' in value && value.key !== undefined) {
				if (value.key.trim() === '') {
					value.error = `Property name can't be empty`;
					errors.push(value.error);
				} else if (keys.includes(value.key)) {
					value.error = `Property name "${value.key}" is already used`;
					errors.push(value.error);
				} else {
					keys.push(value.key);
				}
			}
			if (value.type === 'object' || value.type === 'array') {
				validate(value.children, errors);
			}
			if (
				value.type === 'number' &&
				typeof value.value === 'string' &&
				!value.value.match(/^\d+\.*\d*$/)
			) {
				value.error = 'Invalid number';
				errors.push(value.error);
			}
		}
	}

	/**
	 * @returns {object}
	 */
	export function getArguments() {
		const args = {};
		if (editableArgs.length === 1 && editableArgs[0].type === 'array' && !editableArgs[0].key) {
			// root is array
			return toArgs(editableArgs[0]);
		} else {
			for (const item of editableArgs) {
				args[item.key] = toArgs(item);
			}
		}
		return args;
	}

	/**
	 * @param {import('../types/form').FormBuilderEntry} item
	 */
	function toArgs(item) {
		if (item.type === 'object') {
			const args = {};
			for (const child of item.children) {
				args[child.key] = toArgs(child);
			}
			return args;
		} else if (item.type === 'array') {
			const args = [];
			for (const child of item.children) {
				args.push(toArgs(child));
			}
			return args;
		} else if (item.type === 'number') {
			return Number(item.value);
		} else if (item.type === 'boolean' || item.type === 'string') {
			return item.value;
		}
	}

	/**
	 * @param {object} args
	 */
	export function discardChanges(args) {
		editableArgs = [];
		init(args);
	}

	function triggerChanges() {
		onChange(getArguments());
		editableArgs = editableArgs;
	}
</script>

<div class="mt-2 p-2">
	<!-- eslint-disable-next-line no-unused-vars -->
	{#each editableArgs as _, index (index)}
		<FormEntry
			bind:entry={editableArgs[index]}
			{editable}
			{index}
			parent={editableArgs}
			{addProperty}
			{changeType}
			{removeProperty}
			{triggerChanges}
		/>
	{/each}

	{#if allowAddingProperty}
		<div class="d-flex justify-content-center align-items-center mt-3">
			<button
				class="btn btn-secondary"
				onclick={() => addProperty(editableArgs, true)}
				disabled={!editable}
			>
				Add property
			</button>
		</div>
	{/if}
</div>
