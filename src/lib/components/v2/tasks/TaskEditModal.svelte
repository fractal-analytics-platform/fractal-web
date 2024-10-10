<script>
	import { getOnlyModifiedProperties, nullifyEmptyStrings } from '$lib/common/component_utilities';
	import { AlertError } from '$lib/common/errors';
	import { tick } from 'svelte';
	import Modal from '../../common/Modal.svelte';
	import TypesEditor from './TypesEditor.svelte';

	export let updateEditedTask;

	/** @type {import('$lib/types-v2').TaskV2|undefined} */
	let task;
	/** @type {import('$lib/types-v2').TaskV2|undefined} */
	let originalTask;

	$: updateEnabled = !loading && !saving && task && task.name;
	/** @type {Modal} */
	let modal;
	let loading = false;
	let saved = false;
	let saving = false;

	/** @type {TypesEditor} */
	let typesEditor;

	/**
	 * Edits a task on the server
	 * @returns {Promise<*>}
	 */
	async function handleEditTask() {
		if (!typesEditor.validate()) {
			return;
		}

		modal.confirmAndHide(
			async () => {
				if (!task) {
					return;
				}
				saving = true;

				let taskProperties = nullifyEmptyStrings(task);
				taskProperties = getOnlyModifiedProperties(originalTask, taskProperties);

				taskProperties.input_types = typesEditor.getInputTypes();
				taskProperties.output_types = typesEditor.getOutputTypes();

				const headers = new Headers();
				headers.append('Content-Type', 'application/json');

				const response = await fetch(`/api/v2/task/${task.id}`, {
					method: 'PATCH',
					credentials: 'include',
					headers,
					body: JSON.stringify(taskProperties)
				});

				if (!response.ok) {
					throw new AlertError(await response.json());
				}

				console.log('Task updated successfully');
				updateEditedTask(await response.json());
				saved = true;
			},
			() => {
				saving = false;
			}
		);
	}

	/**
	 * @param {import('$lib/types-v2').TaskV2} taskToEdit
	 */
	export async function open(taskToEdit) {
		loading = true;
		saved = false;
		modal.show();

		// Retrieving the args_schema field
		const response = await fetch(`/api/v2/task/${taskToEdit.id}`, {
			method: 'GET',
			credentials: 'include'
		});

		const result = await response.json();
		loading = false;

		if (response.ok) {
			task = /** @type {import('$lib/types-v2').TaskV2} */ (result);
			originalTask = { ...result };
			// wait the typesEditor element rendering, that happens after task is defined
			await tick();
			typesEditor.init(task.input_types, task.output_types);
		} else {
			modal.displayErrorAlert('Unable to load task');
			task = undefined;
			typesEditor.init({}, {});
			originalTask = undefined;
		}
	}

	async function onClose() {
		if (!task) {
			return;
		}
		if (saved) {
			return;
		}
		for (let key in originalTask) {
			task[key] = originalTask[key];
		}
	}
</script>

<Modal id="taskEditModal" {onClose} bind:this={modal} size="xl">
	<svelte:fragment slot="header">
		{#if task}
			<h1 class="h5 modal-title">Task {task.name}</h1>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="body">
		{#if loading}
			<div class="spinner-border spinner-border-sm" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		{:else if task}
			<div class="row mb-3">
				<div class="col-12">
					<p class="lead">Task properties</p>

					<span id="errorAlert-taskEditModal" />

					<div class="mb-2 row">
						<label for="taskName" class="col-2 col-form-label text-end">Name</label>
						<div class="col-10">
							<input
								id="taskName"
								type="text"
								bind:value={task.name}
								class="form-control"
								class:is-invalid={!task.name}
							/>
							{#if !task.name}
								<div class="invalid-feedback">Required field</div>
							{/if}
						</div>
					</div>

					<div class="mb-2 row">
						<label for="version" class="col-2 col-form-label text-end">Version</label>
						<div class="col-10">
							<input id="version" type="text" bind:value={task.version} class="form-control" />
						</div>
					</div>

					{#if task.command_non_parallel !== null}
						<div class="mb-2 row">
							<label for="command_non_parallel" class="col-2 col-form-label text-end">
								Command non parallel
							</label>
							<div class="col-10">
								<input
									id="command_non_parallel"
									type="text"
									bind:value={task.command_non_parallel}
									class="form-control"
								/>
							</div>
						</div>
					{/if}

					{#if task.command_parallel !== null}
						<div class="mb-2 row">
							<label for="command_parallel" class="col-2 col-form-label text-end">
								Command parallel
							</label>
							<div class="col-10">
								<input
									id="command_parallel"
									type="text"
									bind:value={task.command_parallel}
									class="form-control"
								/>
							</div>
						</div>
					{/if}

					<div class="mb-2 row">
						<label for="source" class="col-2 col-form-label text-end">Source</label>
						<div class="col-10">
							<input
								id="source"
								type="text"
								bind:value={task.source}
								disabled
								class="form-control"
							/>
						</div>
					</div>

					<TypesEditor bind:this={typesEditor} />

					<div class="mb-2 row">
						<label for="argsSchemaVersion" class="col-2 col-form-label text-end">
							Args Schema Version
						</label>
						<div class="col-10">
							<input
								id="ar$gsSchemaVersion"
								type="text"
								bind:value={task.args_schema_version}
								disabled
								class="form-control"
							/>
						</div>
					</div>

					{#if task.command_non_parallel !== null}
						<div class="mb-2 row">
							<label for="argsSchema" class="col-2 col-form-label text-end">
								Args Schema non parallel
							</label>
							<div class="col-10">
								<textarea
									name="argsSchema"
									value={task.args_schema_non_parallel
										? JSON.stringify(task.args_schema_non_parallel, null, 2)
										: null}
									disabled
									class="form-control"
									rows="10"
								/>
							</div>
						</div>
					{/if}

					{#if task.command_parallel !== null}
						<div class="mb-2 row">
							<label for="argsSchema" class="col-2 col-form-label text-end">
								Args Schema parallel
							</label>
							<div class="col-10">
								<textarea
									name="argsSchema"
									value={task.args_schema_parallel
										? JSON.stringify(task.args_schema_parallel, null, 2)
										: null}
									disabled
									class="form-control"
									rows="10"
								/>
							</div>
						</div>
					{/if}

					<div class="mb-2 row">
						<label for="docsLink" class="col-2 col-form-label text-end">Docs Link</label>
						<div class="col-10">
							<input
								id="docsLink"
								type="text"
								bind:value={task.docs_link}
								disabled
								class="form-control"
							/>
						</div>
					</div>

					<div class="mb-2 row">
						<label for="docsInfo" class="col-2 col-form-label text-end">Docs Info</label>
						<div class="col-10">
							<textarea
								id="docsInfo"
								bind:value={task.docs_info}
								disabled
								class="form-control"
								rows="5"
							/>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="footer">
		{#if task}
			<button class="btn btn-primary" on:click={handleEditTask} disabled={!updateEnabled}>
				{#if saving}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
				{/if}
				Update
			</button>
			<button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
		{/if}
	</svelte:fragment>
</Modal>
