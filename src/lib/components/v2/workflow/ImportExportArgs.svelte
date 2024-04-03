<script>
	import { downloadBlob } from '$lib/common/component_utilities';
	import Modal from '$lib/components/common/Modal.svelte';

	/** @type {import('$lib/types-v2').WorkflowTaskV2} */
	export let workflowTask;
	/** @type {(json: object) => Promise<void>} */
	export let onImport;
	/** @type {boolean} */
	export let exportDisabled;

	/** @type {Modal} */
	let importArgsModal;

	/** @type {FileList|null} */
	let importArgsFiles = null;
	/** @type {HTMLInputElement|undefined} */
	let importArgsFileInput = undefined;
	let importArgsError = '';

	function onImportArgsModalOpen() {
		importArgsFiles = null;
		if (importArgsFileInput) {
			importArgsFileInput.value = '';
		}
		importArgsError = '';
	}

	async function importArgs() {
		importArgsError = '';
		if (importArgsFiles === null || importArgsFiles.length === 0) {
			return;
		}
		const file = importArgsFiles[0];
		let content = await file.text();
		let json;
		try {
			json = JSON.parse(content);
		} catch (err) {
			importArgsError = "File doesn't contain valid JSON";
			return;
		}
		importArgsModal.confirmAndHide(async function () {
			await onImport(json);
		});
	}

	function exportArgs() {
		const args = {
			args_parallel: workflowTask.args_parallel,
			args_non_parallel: workflowTask.args_non_parallel
		};
		const serializedArgs = JSON.stringify(args, null, 2);
		downloadBlob(
			serializedArgs,
			`args-${createSlug(workflowTask.task.name)}.json`,
			'text/json;charset=utf-8;'
		);
	}

	/**
	 * @param {string} value
	 */
	function createSlug(value) {
		return value.trim().toLowerCase().replace(/\s+/g, '-');
	}
</script>

<div class="me-auto">
	<button class="btn btn-outline-primary" on:click={() => importArgsModal.show()}>
		<i class="bi bi-upload" />
		Import
	</button>
	<button class="btn btn-outline-primary" on:click={exportArgs} disabled={exportDisabled}>
		<i class="bi bi-download" />
		Export
	</button>
</div>

<Modal
	id="importArgumentsModal"
	onOpen={onImportArgsModalOpen}
	bind:this={importArgsModal}
	size="lg"
>
	<svelte:fragment slot="header">
		<h1 class="h5 modal-title">Import arguments</h1>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div class="row">
			<div class="col needs-validation">
				<label for="importArgsFile"> Select arguments file </label>
				<input
					class="form-control mt-1"
					accept="application/json"
					type="file"
					name="importArgsFile"
					id="importArgsFile"
					bind:this={importArgsFileInput}
					bind:files={importArgsFiles}
					class:is-invalid={importArgsError}
				/>
				<span class="invalid-feedback">{importArgsError}</span>
			</div>
			<div class="form-text">JSON containing workflow task arguments</div>
		</div>
		<div class="row">
			<div class="col">
				<div class="alert alert-warning mt-3">
					<i class="bi bi-exclamation-triangle" />
					The current arguments will be completely overwritten, disregarding any pending changes.
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col">
				<div id="errorAlert-importArgumentsModal" />
			</div>
		</div>
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		<button
			class="btn btn-primary"
			disabled={importArgsFiles === null || importArgsFiles.length === 0}
			on:click={importArgs}
		>
			Confirm
		</button>
	</svelte:fragment>
</Modal>
