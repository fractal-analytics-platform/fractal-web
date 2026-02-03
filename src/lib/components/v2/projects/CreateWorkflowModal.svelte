<script>
	import { AlertError, getAlertErrorFromResponse } from '$lib/common/errors';
	import { page } from '$app/state';
	import Modal from '../../common/Modal.svelte';
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import { normalizePayload } from 'fractal-components';
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {(workflow: import('fractal-components/types/api').WorkflowV2) => void} handleWorkflowImported
	 */

	/** @type {Props} */
	let { handleWorkflowImported } = $props();

	// Component properties
	let creating = $state(false);
	/** @type {boolean|undefined} */
	let importSuccess = $state();
	let workflowName = $state('');

	/** @type {FileList|undefined} */
	let files = $state();
	/** @type {HTMLInputElement|undefined} */
	let fileInput = $state(undefined);

	let workflowFileSelected = $derived(files && files.length > 0);
	let projectId = $derived(page.params.projectId);

	/** @type {Modal|undefined} */
	let modal = $state();

	let workflowImportErrorData = $state(undefined);
	let selectedVersions = $state([]);

	let workflowMetadata = $state(undefined);
	let showOlderVersions = $state(false)

	$effect(() => {
		showOlderVersions;
		if (!workflowImportErrorData) {
			selectedVersions = [];
			return;
		}
		selectedVersions = workflowImportErrorData.map(item =>
			item.outcome === "fail" ? undefined : item.version
		);
	});

	export function show() {
		modal?.show();
	}

	/**
	 * Reset the form fields.
	 */
	export function reset() {
		files = undefined;
		if (fileInput) {
			fileInput.value = '';
		}
		workflowName = '';
		creating = false;
		workflowImportErrorData = undefined;
		workflowMetadata = undefined;
		selectedVersions = [];
		showOlderVersions = false;
		modal?.hideErrorAlert();
	}

	function handleImportOrCreateWorkflow() {
		modal?.confirmAndHide(
			async () => {
				creating = true;
				if (workflowFileSelected) {
					await handleImportWorkflow();
				} else {
					await handleCreateWorkflow();
				}
			},
			() => {
				creating = false;
			}
		);
	}

	async function handleImportWorkflow() {

		if (!workflowImportErrorData) {
			const workflowFile = /** @type {FileList}*/ (files)[0];
			const workflowFileContent = await workflowFile.text();
			
			try {
				workflowMetadata = JSON.parse(workflowFileContent);
			} catch (err) {
				console.error(err);
				throw new AlertError('The workflow file is not a valid JSON file');
			}
		}
		else {
			workflowMetadata.task_list.forEach((item, index) => {
				item.task.version = selectedVersions[index];
			});
		}

		if (workflowName) {
			console.log(`Overriding workflow name from ${workflowMetadata.name} to ${workflowName}`);
			workflowMetadata.name = workflowName;
		}

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/v2/project/${page.params.projectId}/workflow/import`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: normalizePayload(workflowMetadata)
		});

		if (response.ok) {
			// Return a workflow item
			importSuccess = true;
			setTimeout(() => {
				importSuccess = false;
			}, 3000);
			reset();

			/** @type {import('fractal-components/types/api').WorkflowV2} */
			const workflow = await response.json();

			await tick();

			handleWorkflowImported(workflow);
		} else {
			console.error('Import workflow failed');

			const responseJson = await response.clone().json();
			if (responseJson.detail.includes("HAS_ERROR_DATA")) {
				workflowImportErrorData = responseJson.data
				throw new Error();
			}

			throw await getAlertErrorFromResponse(response);
		}
	}

	/**
	 * Creates a new workflow in the server
	 * @returns {Promise<*>}
	 */
	async function handleCreateWorkflow() {
		if (!workflowName) {
			return;
		}

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/v2/project/${projectId}/workflow`, {
			method: 'POST',
			credentials: 'include',
			mode: 'cors',
			headers,
			body: normalizePayload({
				name: workflowName
			})
		});

		if (response.ok) {
			const result = await response.json();
			workflowName = '';
			goto(`/v2/projects/${projectId}/workflows/${result.id}`);
		} else {
			throw await getAlertErrorFromResponse(response);
		}
	}

	async function handleTaskReactivation(taskGroupId) {
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');
		const response = await fetch(
			`/api/v2/task-group/${taskGroupId}/reactivate`,
			{
				method: 'POST',
				credentials: 'include',
				headers,
				body: JSON.stringify({})
			}
		);
		if (response.ok) {
			for (let i = 0; i < workflowImportErrorData.length; i++) {
				if (workflowImportErrorData[i]) {available_tasks}
			}
		} else {
			throw await getAlertErrorFromResponse(response);
		}
	}
</script>

<Modal
	id="createWorkflowModal"
	size="lg"
	centered={true}
	scrollable={true}
	onOpen={reset}
	onClose={reset}
	bind:this={modal}
>
	{#snippet header()}
		<h5 class="modal-title">Create new workflow</h5>
	{/snippet}
	{#snippet body()}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleImportOrCreateWorkflow();
			}}
		>
			<div class="mb-2">
				<label for="workflowName" class="form-label">Workflow name</label>
				<input
					id="workflowName"
					name="workflowName"
					type="text"
					bind:value={workflowName}
					class="form-control"
				/>
			</div>

			{#if !workflowImportErrorData}
				<div class="mb-3">
					<label for="workflowFile" class="form-label">Import workflow from file</label>
					<input
						class="form-control"
						accept="application/json"
						type="file"
						name="workflowFile"
						id="workflowFile"
						bind:this={fileInput}
						bind:files
					/>
				</div>
				<button
					class="btn btn-primary mt-2"
					disabled={(!workflowName && !workflowFileSelected) || creating}
				>
					{#if creating}
						<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
					{/if}
					{#if workflowFileSelected}
						Import workflow
					{:else}
						Create empty workflow
					{/if}
				</button>

			{:else}
					<hr />
					<p>
						Some of the requested tasks could not be found.
					</p>
					<p>
						If the problem is a version mismatch, the list of available versions is provided.
						<br>
						Missing tasks must be collected at the
						<a href="/v2/tasks/management">Tasks management</a> page.
					</p>

					<div class="mb-3">
						<div class="form-check">
							<input
								class="form-check-input"
								type="checkbox"
								id="checkShowOlderVersions"
								bind:checked={showOlderVersions}
							/>
							<label class="form-check-label" for="checkShowOlderVersions">
								Show older versions
							</label>
						</div>
					</div>

				{#each workflowImportErrorData as data, index}
					<hr />	
					<section>
						{#if data.outcome !== "success"}
							<header>
								<BooleanIcon value={false} />
								Task <strong>{data.task_name}</strong> <span>({data.pkg_name})</span>
							</header>

							<br>
							{#if data.available_tasks.length > 0}
								<div>
								{#if data.version}
									Version {data.version} not found.
								{:else}
									No version provided.
								{/if}
								</div>

								<div>
									Available versions:
									<select
										bind:value={selectedVersions[index]}
										style="width: 10ch"
									>
										{#each [...data.available_tasks].sort(
											(a, b) => a.version.localeCompare(b.version)
										) as task}
											{#if !data.version || showOlderVersions || (!showOlderVersions && task.version > data.version)}
												<option
													value={task.version}
													title={task.active ? "" : "Not active"}
												>
													{task.version}{task.active ? "" : " ⚠️"}
												</option>
											{/if}
										{/each}
									</select>
								</div>
							{:else}
							<div>
								Missing task:
								<pre><code>{JSON.stringify(
									{
										pkg_name: data.pkg_name,
										task_name: data.task_name,
										...(data.version != null && { version: data.version })
									},
									null,
									2
								)}</code></pre>
							</div>
							{/if}
						{:else}
							<header>
							<BooleanIcon value={true} />
							Task 
							<strong>
								{data.task_name}
							</strong>
							<span>({data.pkg_name}{#if data.version}, version {data.version}{/if})</span>
							found.
							</header>
						{/if}
					</section>
					{/each}
				<hr />
				<div>
					<button
						class="btn btn-primary mt-2"
						disabled={creating}
					>
						{#if creating}
							<span
								class="spinner-border spinner-border-sm"
								role="status"
								aria-hidden="true"
							></span>
						{/if}
						Import workflow
					</button>
					<button
						class="btn btn-danger mt-2"
						onclick={() => {
							workflowImportErrorData = undefined;
							workflowMetadata = undefined;
							showOlderVersions = false;
						}}
					>
						Cancel
					</button>
				</div>
				
			{/if}
			<div id="errorAlert-createWorkflowModal"></div>
		</form>

		{#if importSuccess}
			<p class="alert alert-primary mt-3">Workflow imported successfully</p>
		{/if}
	{/snippet}
</Modal>
