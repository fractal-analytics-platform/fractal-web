<script>
	import { FormErrorHandler } from '$lib/common/errors';
	import { tick } from 'svelte';
	import Modal from '../../common/Modal.svelte';
	import TypesEditor from './TypesEditor.svelte';
	import { normalizePayload } from 'fractal-components';

	let { updateEditedTask } = $props();

	/** @type {import('fractal-components/types/api').TaskV2|undefined} */
	let task = $state();

	/** @type {Modal|undefined} */
	let modal = $state();
	let loading = $state(false);
	let saving = $state(false);

	/** @type {string|null} */
	let command_parallel = $state(null);
	/** @type {string|null} */
	let command_non_parallel = $state(null);

	/** @type {TypesEditor|undefined} */
	let typesEditor = $state();

	const formErrorHandler = new FormErrorHandler('taskEditModalError', [
		'command_parallel',
		'command_non_parallel'
	]);

	const validationErrors = formErrorHandler.getValidationErrorStore();

	/**
	 * Edits a task on the server
	 * @returns {Promise<*>}
	 */
	async function handleEditTask() {
		if (!typesEditor?.validate()) {
			return;
		}

		saving = true;

		let taskProperties = {};
		if (command_parallel !== null) {
			taskProperties.command_parallel = command_parallel;
		}
		if (command_non_parallel !== null) {
			taskProperties.command_non_parallel = command_non_parallel;
		}

		taskProperties.input_types = typesEditor.getInputTypes();
		taskProperties.output_types = typesEditor.getOutputTypes();

		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		const response = await fetch(`/api/v2/task/${task?.id}`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: normalizePayload(taskProperties, { nullifyEmptyStrings: true })
		});

		if (response.ok) {
			console.log('Task updated successfully');
			updateEditedTask(await response.json());
			modal?.hide();
		} else {
			await formErrorHandler.handleErrorResponse(response);
		}
		saving = false;
	}

	/**
	 * @param {import('fractal-components/types/api').TaskV2} taskToEdit
	 */
	export async function open(taskToEdit) {
		loading = true;
		modal?.show();

		// Retrieving the args_schema field
		const response = await fetch(`/api/v2/task/${taskToEdit.id}`, {
			method: 'GET',
			credentials: 'include'
		});

		const result = await response.json();
		loading = false;

		if (response.ok) {
			task = /** @type {import('fractal-components/types/api').TaskV2} */ (result);
			command_parallel = task.command_parallel;
			command_non_parallel = task.command_non_parallel;
			// wait the typesEditor element rendering, that happens after task is defined
			await tick();
			typesEditor?.init(task.input_types, task.output_types);
		} else {
			modal?.displayErrorAlert('Unable to load task');
			task = undefined;
			typesEditor?.init({}, {});
		}
	}
	let updateEnabled = $derived(!loading && !saving && task && task.name);
</script>

<Modal id="taskEditModal" bind:this={modal} size="xl">
	{#snippet header()}
		{#if task}
			<h1 class="h5 modal-title">Task {task.name}</h1>
		{/if}
	{/snippet}
	{#snippet body()}
		{#if loading}
			<div class="spinner-border spinner-border-sm" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		{:else if task}
			<div class="row mb-3">
				<div class="col-12">
					<p class="lead">Task properties</p>

					<span id="taskEditModalError"></span>

					<div class="mb-2 row">
						<label for="taskName" class="col-2 col-form-label text-end">Name</label>
						<div class="col-10">
							<input
								id="taskName"
								type="text"
								bind:value={task.name}
								class="form-control"
								disabled
							/>
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
									bind:value={command_non_parallel}
									class="form-control"
									class:is-invalid={$validationErrors['command_non_parallel']}
								/>
								<span class="invalid-feedback">{$validationErrors['command_non_parallel']}</span>
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
									bind:value={command_parallel}
									class="form-control"
									class:is-invalid={$validationErrors['command_parallel']}
								/>
								<span class="invalid-feedback">{$validationErrors['command_parallel']}</span>
							</div>
						</div>
					{/if}

					<TypesEditor bind:this={typesEditor} />

					<div class="mb-2 row">
						<label for="argsSchemaVersion" class="col-2 col-form-label text-end">
							Args Schema Version
						</label>
						<div class="col-10">
							<input
								id="argsSchemaVersion"
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
								></textarea>
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
								></textarea>
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
							></textarea>
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/snippet}
	{#snippet footer()}
		<button class="btn btn-primary" onclick={handleEditTask} disabled={!updateEnabled}>
			{#if saving}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
			{/if}
			Update
		</button>
		<button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
	{/snippet}
</Modal>
