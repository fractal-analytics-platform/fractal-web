<script>
	import { originalTaskStore, taskStore } from '$lib/stores/taskStores';
	import { getOnlyModifiedProperties, nullifyEmptyStrings } from '$lib/common/component_utilities';
	import { displayStandardErrorAlert } from '$lib/common/errors';

	export let updateEditedTask;
	/** @type {import('$lib/types').Task|undefined} */
	$: task = $taskStore;
	/** @type {import('$lib/types').Task|undefined} */
	$: originalTask = $originalTaskStore;
	$: updateEnabled = task && task.name && task.command && task.input_type && task.output_type;

	/**
	 * Edits a task on the server
	 * @returns {Promise<*>}
	 */
	async function handleEditTask() {
		if (!task) {
			return;
		}

		let taskProperties = nullifyEmptyStrings(task);
		taskProperties = getOnlyModifiedProperties(originalTask, taskProperties);

		console.log('Task to edit: ' + task.id);

		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		const response = await fetch(`/api/v1/task/${task.id}`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify(taskProperties)
		});

		if (response.ok) {
			console.log('Task updated successfully');
			updateEditedTask(task);
			// @ts-ignore
			// eslint-disable-next-line no-undef
			const modal = bootstrap.Modal.getInstance(document.getElementById('taskEditModal'));
			modal.hide();
		} else {
			displayStandardErrorAlert(await response.json(), 'editTaskErrorAlert');
		}
	}

	async function undoChangesAndClose() {
		if (!task) {
			return;
		}
		for (let key in originalTask) {
			task[key] = originalTask[key];
		}
		// @ts-ignore
		// eslint-disable-next-line no-undef
		const modal = bootstrap.Modal.getInstance(document.getElementById('taskEditModal'));
		modal.hide();
	}
</script>

<div class="modal modal-xl" id="taskEditModal" data-bs-backdrop="static">
	<div class="modal-dialog">
		{#if task}
			<div class="modal-content">
				<div class="modal-header">
					<h1 class="h5 modal-title">Task {task.name}</h1>
				</div>
				<div class="modal-body">
					<div class="row mb-3">
						<div class="col-12">
							<p class="lead">Task properties</p>

							<span id="editTaskErrorAlert" />

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

							<div class="mb-2 row">
								<label for="owner" class="col-2 col-form-label text-end">Owner</label>
								<div class="col-10">
									<input
										id="owner"
										type="text"
										bind:value={task.owner}
										disabled
										class="form-control"
									/>
								</div>
							</div>

							<div class="mb-2 row">
								<label for="command" class="col-2 col-form-label text-end">Command</label>
								<div class="col-10">
									<input
										id="command"
										type="text"
										bind:value={task.command}
										class="form-control"
										class:is-invalid={!task.command}
									/>
									{#if !task.command}
										<div class="invalid-feedback">Required field</div>
									{/if}
								</div>
							</div>

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

							<div class="mb-2 row">
								<label for="inputType" class="col-2 col-form-label text-end">Input Type</label>
								<div class="col-10">
									<input
										id="inputType"
										type="text"
										bind:value={task.input_type}
										class="form-control"
										class:is-invalid={!task.input_type}
									/>
									{#if !task.input_type}
										<div class="invalid-feedback">Required field</div>
									{/if}
								</div>
							</div>

							<div class="mb-2 row">
								<label for="outputType" class="col-2 col-form-label text-end">Output Type</label>
								<div class="col-10">
									<input
										id="outputType"
										type="text"
										bind:value={task.output_type}
										class="form-control"
										class:is-invalid={!task.output_type}
									/>
									{#if !task.output_type}
										<div class="invalid-feedback">Required field</div>
									{/if}
								</div>
							</div>

							<div class="mb-2 row">
								<label for="argsSchemaVersion" class="col-2 col-form-label text-end"
									>Args Schema Version</label
								>
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

							<div class="mb-2 row">
								<label for="argsSchema" class="col-2 col-form-label text-end">Args Schema</label>
								<div class="col-10">
									<textarea
										name="argsSchema"
										value={JSON.stringify(task.args_schema, null, 2)}
										disabled
										class="form-control"
										rows="10"
									/>
								</div>
							</div>

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
				</div>
				<div class="modal-footer">
					<button class="btn btn-primary" on:click={handleEditTask} disabled={!updateEnabled}>
						Update
					</button>
					<button class="btn btn-secondary" on:click={undoChangesAndClose}>Close</button>
				</div>
			</div>
		{/if}
	</div>
</div>
