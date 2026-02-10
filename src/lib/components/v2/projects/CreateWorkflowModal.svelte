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

	/** @type {import('fractal-components/types/api').WorkflowImportErrorData[]|undefined} */
	let workflowImportErrorData = $state(undefined);
	/** @type {(string|undefined)[]} */
	let selectedVersions = $state([]);

	/** @type {import('fractal-components/types/api').WorkflowImport|undefined} */
	let workflowMetadata = $state(undefined);

	let includeOlderVersions = $state(false)

	$effect(() => {
		includeOlderVersions;
		if (!workflowImportErrorData) {
			selectedVersions = [];
			return;
		}
		selectedVersions = workflowImportErrorData.map(item =>
			item.outcome === "fail"
			? undefined
			: item.version !== null
				? item.version
				: undefined
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
		includeOlderVersions = false;
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
			const workflowFile = /** @type {FileList} */ (files)[0];
			try {
				workflowMetadata = JSON.parse(await workflowFile.text());
			} catch (err) {
				console.error(err);
				throw new AlertError('The workflow file is not a valid JSON file');
			}
		}

		if (workflowMetadata) {
			workflowMetadata.task_list.forEach((item, index) => {
				const version = selectedVersions[index];
				if (version !== undefined) {
					item.task.version = version;
				}
			});

			if (workflowName) {
				console.log(`Overriding workflow name from ${workflowMetadata.name} to ${workflowName}`);
				workflowMetadata.name = workflowName;
			}
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

			const alertError = await getAlertErrorFromResponse(response);
			const result = alertError.reason;

			if (typeof result === 'object' && 'detail' in result && result.detail.includes("HAS_ERROR_DATA")) {
				workflowImportErrorData = result.data
				throw new Error();
			}

			throw alertError;
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
						Some of the requested tasks are not available on this Fractal instance.
						You can collect missing task packages at the <a href="/v2/tasks/management">Tasks management</a> page, 
						or select one of the available versions listed below.
					</p>

					<div class="mb-3">
						<div class="form-check">
							<input
								class="form-check-input"
								type="checkbox"
								id="checkIncludeOlderVersions"
								bind:checked={includeOlderVersions}
							/>
							<label class="form-check-label" for="checkIncludeOlderVersions">
								<i>Include older versions</i>
							</label>
						</div>
					</div>

				{#each workflowImportErrorData as data, index (index)}
					<hr />	
					<section>
						<div style="display: flex; align-items: center; gap: 8px;">
							<div>
								{#if data.outcome === "success" || selectedVersions[index]}
									<BooleanIcon value={true} />
								{:else}
									<BooleanIcon value={false} />
								{/if}
							</div>
							<div>
								Task <strong>{data.task_name}</strong> <span>({data.pkg_name})</span>
							</div>
						</div>
						<div>Requested version: {data.version || '-'}</div>
						<div>
						{#if data.outcome !== "success"}
							{#if data.available_tasks.some(task => !data.version || includeOlderVersions || (!includeOlderVersions && task.version > data.version))}
							<div class="row row-cols-lg-auto g-3 align-items-center">
  							<div class="col-12">
								Available versions:
							</div>
							<div class="col-12">
								<select
									bind:value={selectedVersions[index]}
									style="width: 15ch"
									class="form-select"
								>
									<option value={undefined}>Select...</option>
									{#each [...data.available_tasks].sort(
										(a, b) => a.version.localeCompare(b.version)
									) as task, i (i)}
										{#if !data.version || includeOlderVersions || (!includeOlderVersions && task.version > data.version)}
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
							</div>
							{:else}
								No available versions.<br>
								You should collect the task package at the <a href="/v2/tasks/management">Tasks management</a>
								page{#if !includeOlderVersions}, or try including older versions{/if}.
							{/if}
						{/if}
						</div>
					</section>
					{/each}
				<hr />
				<div>
					<button
						class="btn btn-primary mt-2"
						disabled={creating || selectedVersions.some(v => v === undefined)}
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
							includeOlderVersions = false;
						}}
					>
						Cancel
					</button>
				</div>
				
			{/if}
			<div class="mt-2" id="errorAlert-createWorkflowModal"></div>
		</form>

		{#if importSuccess}
			<p class="alert alert-primary mt-3">Workflow imported successfully</p>
		{/if}
	{/snippet}
</Modal>
