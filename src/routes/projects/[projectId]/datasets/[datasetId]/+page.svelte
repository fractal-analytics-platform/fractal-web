<style type='text/css'>
	pre {display: inline;}
</style>

<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte';
	import { fieldHasValue } from '$lib/common/component_utilities';

	let projectId = $page.params.projectId;
	let datasetId = $page.params.datasetId;

	$: project = $page.data.project;
	let dataset = undefined;
	let enableCreateResource = false;
	let updateDatasetSuccess = false;
	let createResourceSuccess = false;

	onMount(async () => {
		dataset = await $page.data.dataset;
	});

	async function handleDatasetUpdate() {
		return async ({ result }) => {
			if (result.type !== 'failure') {
				const updatedDataset = result.data;
				dataset = updatedDataset;
				updateDatasetSuccess = true;
				setTimeout(() => {
					updateDatasetSuccess = false;
				}, 1200);
			} else {
				new StandardErrorAlert({
					target: document.getElementById('updateDatasetError'),
					props: {
						error: result.data
					}
				});
			}
		};
	}

	async function handleCreateDatasetResource({ form }) {
		return async ({ result }) => {
			if (result.type !== 'failure') {
				const datasetResource = result.data;
				dataset.resource_list.push(datasetResource);
				// This is required in order to trigger svelte reactivity
				dataset.resource_list = dataset.resource_list;
				createResourceSuccess = true;
				setTimeout(() => {
					createResourceSuccess = false;
				}, 1200);
				form.reset();
				enableCreateResource = false;
			} else {
				new StandardErrorAlert({
					target: document.getElementById('createDatasetResourceError'),
					props: {
						error: result.data
					}
				});
			}
		};
	}

	async function handleDeleteDatasetResource(resourceId) {
		const response = await fetch(
			'/projects/' + projectId + '/datasets/' + datasetId + '/resource/' + resourceId,
			{
				method: 'DELETE',
				credentials: 'include'
			}
		);

		if (response.ok) {
			console.log('Dataset resource deleted');
			dataset.resource_list = dataset.resource_list.filter((r) => r.id !== resourceId);
		} else {
			console.error(response.statusText);
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
			<button class="btn btn-light" data-bs-toggle="modal" data-bs-target="#updateDatasetModal"
				><i class="bi-gear-wide-connected" /></button
			>
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
			<div class='col-8'>
				<div class='d-flex align-items-center justify-content-between'>
					<span class='lead py-3'>Dataset resources</span>
					<button
						class='btn btn-primary btn-sm'
						data-bs-toggle='modal'
						data-bs-target='#createDatasetResourceModal'>New resource
					</button
					>
				</div>
				<table class='table table-bordered caption-top align-middle'>
					<thead class='bg-light'>
					<tr>
						<th class='col-1'>Id</th>
						<th class='col-9'>Path</th>
						<th class='col-2'>Options</th>
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
										callbackAction={handleDeleteDatasetResource.bind(this, resource.id)}
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

<div class="modal" id="createDatasetResourceModal">
	<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">Create dataset resource</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" />
			</div>
			<div class="modal-body">
				<div id="createDatasetResourceError" />

				<form
					method="post"
					action="?/createDatasetResource"
					use:enhance={handleCreateDatasetResource}
				>
					<div class="mb-3">
						<label for="source" class="form-label">Resource path</label>
						<input
							class="form-control"
							type="text"
							name="source"
							id="source"
							on:input={(event) => {enableCreateResource = fieldHasValue(event)}} />
					</div>

					<button class="btn btn-primary" disabled={!enableCreateResource}>Create new resource</button>
				</form>

				{#if createResourceSuccess}
					<p class="alert alert-success mt-3">Resource created</p>
				{/if}
			</div>
		</div>
	</div>
</div>

{#if dataset}
	<div class="modal" id="updateDatasetModal">
		<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">Update dataset properties</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" />
				</div>
				<div class="modal-body">
					<div id="updateDatasetError" />

					<form method="post" action="?/updateDatasetProperties" use:enhance={handleDatasetUpdate}>
						<div class="mb-3">
							<label for="name" class="form-label">Dataset name</label>
							<input class="form-control" type="text" name="name" id="name" value={dataset.name} />
						</div>
						<div class="mb-3">
							<label for="type" class="form-label">Dataset type</label>
							<input class="form-control" type="text" name="type" id="type" value={dataset.type} />
						</div>
						<div class="mb-3">
							<input
								class="form-check-input"
								type="checkbox"
								name="read_only"
								id="read_only"
								checked={dataset.read_only}
							/>
							<label for="read_only" class="form-check-label">Readonly dataset?</label>
						</div>

						<div class="d-flex align-items-center">
							<button class="btn btn-primary me-3">Update</button>
							{#if updateDatasetSuccess}
								<span class="text-success">Dataset properties updated with success</span>
							{/if}
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if dataset && Object.keys(dataset.meta).length > 0}
	<div class="modal" id="datasetMetaModal">
		<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">Dataset meta properties</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" />
				</div>
				<div class="modal-body">
					<ul class="list-group">
						{#each Object.entries(dataset.meta) as [key, value]}
							<li class="list-group-item text-bg-light">
								<span class="text-capitalize">{key}</span>
							</li>
							<li class="list-group-item text-break">
								{#if value === null}
									<span>-</span>
								{:else if typeof value == "object"}
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
				</div>
			</div>
		</div>
	</div>
{/if}
