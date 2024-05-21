<script>
	import { onDestroy } from 'svelte';

	/** @type {object} */
	export let schema;
	/** @type {object} */
	export let data;

	let editor;

	onDestroy(() => {
		editor?.destroy();
	});

	$: if (schema) {
		initEditor(schema);
	}

	$: if (data && ready) {
		editor?.setValue(data);
	}

	export let changed = false;
	let ready = false;

	async function initEditor(schema) {
		ready = false;
		editor?.destroy();
		// We need to import the library in client-side code because for some reasons it produces errors when is rendered server side
		const { JSONEditor } = /** @type {any} */ (await import('@json-editor/json-editor'));
		const element = document.getElementById('json-editor-holder');
		editor = new JSONEditor(element, {
			schema,
			theme: 'bootstrap5',
			titleHidden: true,
			disable_edit_json: true,
			remove_empty_properties: true
		});
		editor.on('change', () => {
			changed = true;
		});
		editor.on('ready', () => {
			ready = true;
		});
	}

	export function validate() {
		return editor.validate();
	}

	export function getValue() {
		return editor?.getValue();
	}
</script>

<div id="json-editor-holder" />
