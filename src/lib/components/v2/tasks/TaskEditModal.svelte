<script>
	import { getOnlyModifiedProperties, nullifyEmptyStrings } from '$lib/common/component_utilities';
	import { AlertError } from '$lib/common/errors';
	import Modal from '../../common/Modal.svelte';

	export let updateEditedTask;

	/** @type {import('$lib/types-v2').TaskV2|undefined} */
	let task;
	/** @type {Array<{ key: string, value: boolean, error: string }>} */
	let inputTypes = [];
	/** @type {Array<{ key: string, value: boolean, error: string }>} */
	let outputTypes = [];
	/** @type {import('$lib/types-v2').TaskV2|undefined} */
	let originalTask;

	$: updateEnabled = !loading && !saving && task && task.name;
	/** @type {Modal} */
	let modal;
	let loading = false;
	let saved = false;
	let saving = false;

	/**
	 * Edits a task on the server
	 * @returns {Promise<*>}
	 */
	async function handleEditTask() {
		inputTypes = validateTypes(inputTypes);
		outputTypes = validateTypes(outputTypes);
		if (typesHaveErrors(inputTypes) || typesHaveErrors(outputTypes)) {
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

				taskProperties.input_types = getTypesFromArray(inputTypes);
				taskProperties.output_types = getTypesFromArray(outputTypes);

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

		if (response.ok) {
			task = /** @type {import('$lib/types-v2').TaskV2} */ (result);
			originalTask = { ...result };
			inputTypes = getArrayFromTypes(task.input_types);
			outputTypes = getArrayFromTypes(task.output_types);
		} else {
			modal.displayErrorAlert('Unable to load task');
			task = undefined;
			inputTypes = [];
			outputTypes = [];
			originalTask = undefined;
		}
		loading = false;
	}

	/**
	 * @param {{ [key: string]: boolean }} types
	 * @returns {Array<{ key: string, value: boolean, error: string }>}
	 */
	function getArrayFromTypes(types) {
		return Object.entries(types).map(([key, value]) => ({ key, value, error: '' }));
	}

	/**
	 * @param {Array<{ key: string, value: boolean, error: string }>} items
	 * @returns {Array<{ key: string, value: boolean, error: string }>}
	 */
	function validateTypes(items) {
		return items.map((item) =>
			item.key ? { ...item, error: '' } : { ...item, error: 'Key is required' }
		);
	}

	/**
	 * @param {Array<{ key: string, value: boolean, error: string }>} items
	 * @returns {boolean}
	 */
	function typesHaveErrors(items) {
		return items.filter((t) => t.error !== '').length > 0;
	}

	/**
	 *
	 * @param {Array<{ key: string, value: boolean, error: string }>} items
	 * @returns {{ [key: string]: boolean }}
	 */
	function getTypesFromArray(items) {
		return Object.fromEntries(items.map((i) => [i.key, i.value]));
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

	function addInputType() {
		inputTypes = [...inputTypes, { key: '', value: false, error: '' }];
	}

	function addOutputType() {
		outputTypes = [...outputTypes, { key: '', value: false, error: '' }];
	}

	/**
	 * @param {number} index
	 */
	function removeInputType(index) {
		inputTypes = inputTypes.filter((_, i) => i !== index);
	}

	/**
	 * @param {number} index
	 */
	function removeOutputType(index) {
		outputTypes = outputTypes.filter((_, i) => i !== index);
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

					<div class="mb-2 row">
						<label for="owner" class="col-2 col-form-label text-end">Owner</label>
						<div class="col-10">
							<input id="owner" type="text" bind:value={task.owner} disabled class="form-control" />
						</div>
					</div>

					<div class="mb-2 row">
						<label for="command_non_parallel" class="col-2 col-form-label text-end"
							>Command non parallel</label
						>
						<div class="col-10">
							<input
								id="command_non_parallel"
								type="text"
								bind:value={task.command_non_parallel}
								class="form-control"
							/>
						</div>
					</div>

					<div class="mb-2 row">
						<label for="command_parallel" class="col-2 col-form-label text-end"
							>Command parallel</label
						>
						<div class="col-10">
							<input
								id="command_parallel"
								type="text"
								bind:value={task.command_parallel}
								class="form-control"
							/>
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
						<span class="col-2 col-form-label text-end"> Input Types </span>
						{#if inputTypes.length > 0}
							<div class="col-7">
								{#each inputTypes as inputType, index}
									<div class="row">
										<div class="col">
											<div class="input-group mb-1" class:has-validation={inputType.error}>
												<input
													type="text"
													class="form-control flag-filter-key"
													placeholder="Key"
													bind:value={inputType.key}
													class:is-invalid={inputType.error}
												/>
												<div class="input-group-text">
													<label>
														<input
															class="form-check-input me-1"
															type="checkbox"
															bind:checked={inputType.value}
															aria-label="Value for {inputType.key}"
														/>
														{inputType.value}
													</label>
												</div>
												<button
													class="btn btn-outline-danger"
													type="button"
													on:click={() => removeInputType(index)}
													aria-label="Remove input type"
												>
													<i class="bi bi-trash" />
												</button>
												{#if inputType.error}
													<div class="invalid-feedback">{inputType.error}</div>
												{/if}
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
						<div class="col-3">
							<button class="btn btn-outline-primary" on:click={addInputType}>
								Add input type
							</button>
						</div>
					</div>

					<div class="mb-2 row">
						<span class="col-2 col-form-label text-end"> Output Types </span>
						{#if outputTypes.length > 0}
							<div class="col-7">
								{#each outputTypes as outputType, index}
									<div class="row">
										<div class="col">
											<div class="input-group mb-1" class:has-validation={outputType.error}>
												<input
													type="text"
													class="form-control flag-filter-key"
													placeholder="Key"
													bind:value={outputType.key}
													class:is-invalid={outputType.error}
												/>
												<div class="input-group-text">
													<label>
														<input
															class="form-check-input me-1"
															type="checkbox"
															bind:checked={outputType.value}
															aria-label="Value for {outputType.key}"
														/>
														{outputType.value}
													</label>
												</div>
												<button
													class="btn btn-outline-danger"
													type="button"
													on:click={() => removeOutputType(index)}
													aria-label="Remove output type"
												>
													<i class="bi bi-trash" />
												</button>
												{#if outputType.error}
													<div class="invalid-feedback">{outputType.error}</div>
												{/if}
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
						<div class="col-3">
							<button class="btn btn-outline-primary" on:click={addOutputType}>
								Add output type
							</button>
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
						<label for="argsSchema" class="col-2 col-form-label text-end"
							>Args Schema non parallel</label
						>
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

					<div class="mb-2 row">
						<label for="argsSchema" class="col-2 col-form-label text-end"
							>Args Schema parallel</label
						>
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
