<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { AlertError } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';

	let projectId = $page.params.projectId;
	let datasetId = $page.params.datasetId;

	$: project = $page.data.project;

	let dataset = undefined;

	// for updating the dataset
	let name = '';
	let type = '';
	let read_only = false;
	let updateDatasetSuccess = false;
	/** @type {Modal} */
	let updateDatasetModal;

	// for creating a new resource
	let source = '';
	let createResourceSuccess = false;
	/** @type {Modal} */
	let createDatasetResourceModal;

	onMount(async () => {
		dataset = await $page.data.dataset;
		// working on a copy
		({ name, type, read_only } = dataset);
	});

	/**
	 * Updates a project's dataset in the server
	 * @returns {Promise<*>}
	 */
	async function handleDatasetUpdate() {
		updateDatasetSuccess = false;

		if (!dataset || !name) {
			return;
		}

		const requestBody = {
			name,
			type,
			read_only
		};

		// Should prevent requestBody null or empty values
		Object.keys(requestBody).forEach((key) => {
			if (requestBody[key] === null || requestBody[key] === '') {
				delete requestBody[key];
			}
		});

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/v1/project/${projectId}/dataset/${datasetId}`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify(requestBody)
		});

		const result = await response.json();
		if (response.ok) {
			dataset = result;
			updateDatasetSuccess = true;
		} else {
			updateDatasetModal.displayErrorAlert(result);
		}
	}

	function onCreateDatasetResourceModalOpen() {
		source = '';
	}

	/**
	 * Creates a project's dataset resource in the server
	 * @returns {Promise<*>}
	 */
	async function handleCreateDatasetResource() {
		createResourceSuccess = false;
		createDatasetResourceModal.hideErrorAlert();
		if (!source) {
			return;
		}

		const headers = new Headers();
		headers.set('Content-Type', 'application/json');

		const response = await fetch(`/api/v1/project/${projectId}/dataset/${datasetId}/resource/`, {
			method: 'POST',
			credentials: 'include',
			mode: 'cors',
			headers,
			body: JSON.stringify({
				path: source
			})
		});

		const result = await response.json();
		if (response.ok) {
			dataset.resource_list = [...dataset.resource_list, result];
			createResourceSuccess = true;
			source = '';
		} else {
			createDatasetResourceModal.displayErrorAlert(result);
		}
	}

	/**
	 * Deletes a project's dataset resource from the server
	 * @param {number} resourceId
	 * @returns {Promise<*>}
	 */
	async function handleDeleteDatasetResource(resourceId) {
		const response = await fetch(
			`/api/v1/project/${projectId}/dataset/${datasetId}/resource/${resourceId}`,
			{
				method: 'DELETE',
				credentials: 'include'
			}
		);

		if (response.ok) {
			console.log('Dataset resource deleted');
			dataset.resource_list = dataset.resource_list.filter((r) => r.id !== resourceId);
		} else {
			const error = await response.json();
			console.error('Error deleting dataset resource', error);
			throw new AlertError(error);
		}
	}
</script>

<div class="d-flex justify-content-between align-items-center">
	<nav aria-label="breadcrumb">
		<ol class="breadcrumb">
			<li class="breadcrumb-item" aria-current="page">
				<a href="/projects">Projects</a>
			</li>
			<li class="breadcrumb-item" aria-current="page">
				<a href="/projects/{projectId}">{project?.name}</a>
			</li>
			<li class="breadcrumb-item" aria-current="page">Datasets</li>
			{#if dataset}
				<li class="breadcrumb-item active" aria-current="page">{dataset.name}</li>
			{/if}
		</ol>
	</nav>
	<div>
		{#if dataset && Object.keys(dataset.meta).length > 0}
			<button class="btn btn-light" data-bs-target="#datasetMetaModal" data-bs-toggle="modal"
				><i class="bi-arrow-up-right-square" /> Show meta properties</button
			>
		{/if}
		{#if dataset}
			<button
				class="btn btn-light"
				data-bs-toggle="modal"
				data-bs-target="#updateDatasetModal"
				on:click={() => (updateDatasetSuccess = false)}
			>
				<i class="bi-gear-wide-connected" />
			</button>
		{/if}
	</div>
</div>

{#if dataset}
	<div class="container">
		<div class="d-flex justify-content-between align-items-center my-3">
			<h1>Dataset {dataset.name} #{dataset.id}</h1>
		</div>

		<div class="row mt-2">
			<div class="col-4">
				<div class="d-flex align-items-center justify-content-between">
					<span class="lead py-3">Dataset properties</span>
				</div>
				<ul class="list-group">
					<li class="list-group-item text-bg-light">
						<span>Id</span>
					</li>
					<li class="list-group-item">
						<span>{dataset.id}</span>
					</li>
					<li class="list-group-item text-bg-light">
						<span>Name</span>
					</li>
					<li class="list-group-item">
						<span>{dataset.name}</span>
					</li>
					<li class="list-group-item text-bg-light">
						<span>Type</span>
					</li>
					<li class="list-group-item">
						<span>{dataset.type}</span>
					</li>
					<li class="list-group-item text-bg-light">
						<span>Readonly</span>
					</li>
					<li class="list-group-item">
						<span class="badge bg-info">{dataset.read_only}</span>
					</li>
				</ul>
			</div>
			<div class="col-8">
				<div class="d-flex align-items-center justify-content-between">
					<span class="lead py-3">Dataset resources</span>
					<button
						class="btn btn-primary btn-sm"
						data-bs-toggle="modal"
						data-bs-target="#createDatasetResourceModal"
						>New resource
					</button>
				</div>
				<table class="table table-bordered caption-top align-middle">
					<thead class="bg-light">
						<tr>
							<th class="col-1">Id</th>
							<th class="col-9">Path</th>
							<th class="col-2">Options</th>
						</tr>
					</thead>
					<tbody>
						{#each dataset.resource_list as resource}
							<tr>
								<td>{resource.id}</td>
								<td class="text-break"><code>{resource.path}</code></td>
								<td>
									<ConfirmActionButton
										modalId="confirmDeleteResource{resource.id}"
										style="danger"
										btnStyle="danger"
										label="Delete"
										message="Delete a dataset resource"
										callbackAction={() => handleDeleteDatasetResource(resource.id)}
										buttonIcon="trash"
									/>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
{/if}

<Modal
	id="createDatasetResourceModal"
	size="lg"
	centered={true}
	scrollable={true}
	bind:this={createDatasetResourceModal}
	onOpen={onCreateDatasetResourceModalOpen}
>
	<svelte:fragment slot="header">
		<h5 class="modal-title">Create dataset resource</h5>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<form on:submit|preventDefault={handleCreateDatasetResource}>
			<div id="errorAlert-createDatasetResourceModal" />
			<div class="mb-3">
				<label for="source" class="form-label">Resource path</label>
				<input class="form-control" type="text" name="source" id="source" bind:value={source} />
			</div>
			<button class="btn btn-primary" disabled={!source} type="submit">
				Create new resource
			</button>
			{#if createResourceSuccess}
				<p class="alert alert-success mt-3">Resource created</p>
			{/if}
		</form>
	</svelte:fragment>
</Modal>

{#if dataset}
	<Modal
		id="updateDatasetModal"
		size="lg"
		centered={true}
		scrollable={true}
		bind:this={updateDatasetModal}
	>
		<svelte:fragment slot="header">
			<h5 class="modal-title">Update dataset properties</h5>
		</svelte:fragment>
		<svelte:fragment slot="body">
			<form on:submit|preventDefault={handleDatasetUpdate}>
				<div id="errorAlert-updateDatasetModal" />
				<div class="mb-3">
					<label for="name" class="form-label">Dataset name</label>
					<input
						class="form-control"
						type="text"
						name="name"
						id="name"
						class:is-invalid={!name}
						bind:value={name}
					/>
					{#if !name}
						<div class="invalid-feedback">The dataset name can not be empty</div>
					{/if}
				</div>
				<div class="mb-3">
					<label for="type" class="form-label">Dataset type</label>
					<input class="form-control" type="text" name="type" id="type" bind:value={type} />
				</div>
				<div class="mb-3">
					<input
						class="form-check-input"
						type="checkbox"
						name="read_only"
						id="read_only"
						bind:checked={read_only}
					/>
					<label for="read_only" class="form-check-label">Readonly dataset?</label>
				</div>

				<div class="d-flex align-items-center">
					<button class="btn btn-primary me-3" type="submit" disabled={!name}>Update</button>
					{#if updateDatasetSuccess}
						<span class="text-success">Dataset properties updated with success</span>
					{/if}
				</div>
			</form>
		</svelte:fragment>
	</Modal>
{/if}

{#if dataset && Object.keys(dataset.meta).length > 0}
	<Modal id="datasetMetaModal" size="lg" centered={true} scrollable={true}>
		<svelte:fragment slot="header">
			<h5 class="modal-title">Dataset meta properties</h5>
		</svelte:fragment>
		<svelte:fragment slot="body">
			<ul class="list-group">
				{#each Object.entries(dataset.meta) as [key, value]}
					<li class="list-group-item text-bg-light">
						<span class="text-capitalize">{key}</span>
					</li>
					<li class="list-group-item text-break">
						{#if value === null}
							<span>-</span>
						{:else if typeof value == 'object'}
							{#if Object.keys(value).length > 1}
								<code><pre>{JSON.stringify(value, null, 2)}</pre></code>
							{:else}
								<code><pre>{JSON.stringify(value, null)}</pre></code>
							{/if}
						{:else}
							<code>{value}</code>
						{/if}
					</li>
				{/each}
			</ul>
		</svelte:fragment>
	</Modal>
{/if}

<style type="text/css">
	pre {
		display: inline;
	}
</style>
