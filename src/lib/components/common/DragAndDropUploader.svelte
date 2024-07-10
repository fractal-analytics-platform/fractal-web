<script>
	import { createEventDispatcher } from 'svelte';

	/** @type {string} */
	export let id;
	/** @type {string} */
	export let description;
	/** @type {string} */
	export let accept;
	export let required = false;

	/** @type {(content: string) => any} */
	export let validateFile;

	/** @type {(type: string, detail?: any) => boolean} */
	const dispatch = createEventDispatcher();

	/** @type {FileList|null} */
	let files = null;
	/** @type {HTMLInputElement|undefined} */
	let fileInput = undefined;
	let fileError = '';

	async function onFileSelected() {
		fileError = '';
		if (!files || files.length === 0) {
			dispatch('change', { value: null });
			return;
		}
		const file = files[0];
		await processFile(file);
	}

	export function clearSelectedFile() {
		fileError = '';
		files = null;
		if (fileInput) {
			fileInput.value = '';
		}
		dispatch('change', { value: null });
	}

	/**
	 * @param {DragEvent} ev
	 */
	async function handleDrop(ev) {
		ev.preventDefault();
		dragOver = false;

		if (!ev.dataTransfer) {
			return;
		}

		if (ev.dataTransfer.files.length > 0) {
			files = ev.dataTransfer.files;
			/** @type {HTMLInputElement} */ (fileInput).files = files;
			await processFile(files[0]);
		}
	}

	/**
	 * @param {File} file
	 */
	async function processFile(file) {
		fileError = '';
		let content = await file.text();
		try {
			const data = validateFile(content);
			dispatch('change', { value: data });
		} catch (err) {
			fileError = /** @type {Error}*/ (err).message;
			dispatch('change', { value: null });
		}
	}

	let dragOver = false;

	/**
	 * @param {DragEvent} ev
	 */
	function handleDragOver(ev) {
		// Prevent default behavior (Prevent file from being opened)
		ev.preventDefault();
		dragOver = true;
	}

	function handleDragLeave() {
		dragOver = false;
	}
</script>

<div
	class="dropZone bg-light"
	on:drop={handleDrop}
	on:dragover={handleDragOver}
	on:dragleave={handleDragLeave}
	class:dragOver
>
	<div class="m-1">
		<div class="input-group has-validation">
			<label for={id} class="input-group-text">
				{description}
			</label>
			<input
				class="form-control"
				{accept}
				type="file"
				name={id}
				{id}
				bind:this={fileInput}
				bind:files
				class:is-invalid={fileError}
				on:change={onFileSelected}
				{required}
			/>
			{#if files && files.length > 0}
				<button class="btn btn-outline-secondary" on:click={clearSelectedFile}> Clear </button>
			{/if}
			<span class="invalid-feedback">{fileError}</span>
		</div>
	</div>
	<p class="text-center mt-1 mb-1">
		<i class="bi bi-file-earmark-arrow-up" /> or drag file here
	</p>
</div>

<style>
	.dropZone {
		outline: 2px dashed #00b3bb;
		outline-offset: -8px;
		padding: 10px;
		border-radius: 3px;
	}

	.dragOver {
		background-color: #c8e5ff !important;
	}
</style>
