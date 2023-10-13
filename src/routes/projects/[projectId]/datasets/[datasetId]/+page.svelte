<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Modal from '$lib/components/common/Modal.svelte';

	let projectId = $page.params.projectId;

	$: project = $page.data.project;

	/** @type {import('$lib/types').Dataset | undefined} */
	let dataset = undefined;

	onMount(async () => {
		dataset = await $page.data.dataset;
	});

	/**
	 * Returns the dataset history formatted in JSON hiding some values.
	 *
	 * @param {import('$lib/types').DatasetHistoryItem} historyItem
	 * @returns {string}
	 */
	function formatDatasetHistory(historyItem) {
		return JSON.stringify(
			{
				...historyItem,
				workflowtask: {
					...historyItem.workflowtask,
					task: {
						...historyItem.workflowtask.task,
						args_schema: historyItem.workflowtask.task.args_schema ? '[HIDDEN]' : undefined,
						docs_info: historyItem.workflowtask.task.docs_info ? '[HIDDEN]' : undefined,
						docs_link: historyItem.workflowtask.task.docs_link ? '[HIDDEN]' : undefined
					}
				}
			},
			null,
			2
		);
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
		{#if dataset}
			<button class="btn btn-light" data-bs-target="#datasetMetaModal" data-bs-toggle="modal">
				<i class="bi-arrow-up-right-square" />
				Show dataset metadata
			</button>
			<button class="btn btn-light" data-bs-target="#datasetHistoryModal" data-bs-toggle="modal">
				<i class="bi-arrow-up-right-square" />
				Show dataset history
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
						<strong>Id</strong>
					</li>
					<li class="list-group-item">
						<span>{dataset.id}</span>
					</li>
					<li class="list-group-item text-bg-light">
						<strong>Name</strong>
					</li>
					<li class="list-group-item">
						<span>{dataset.name}</span>
					</li>
					<li class="list-group-item text-bg-light">
						<strong>Type</strong>
					</li>
					<li class="list-group-item">
						<span>{dataset.type || 'Unknown'}</span>
					</li>
					<li class="list-group-item text-bg-light">
						<strong>Readonly</strong>
					</li>
					<li class="list-group-item">
						<span class="badge bg-info">{dataset.read_only}</span>
					</li>
				</ul>
			</div>
			<div class="col-8">
				<div class="d-flex align-items-center justify-content-between">
					<span class="lead py-3">Dataset resources</span>
				</div>
				<table class="table table-bordered caption-top align-middle">
					<thead class="bg-light">
						<tr>
							<th class="col-1">Id</th>
							<th class="col">Path</th>
						</tr>
					</thead>
					<tbody>
						{#each dataset.resource_list as resource}
							<tr>
								<td>{resource.id}</td>
								<td class="text-break"><code>{resource.path}</code></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
{/if}

{#if dataset}
	<Modal id="datasetMetaModal" size="lg" centered={true} scrollable={true}>
		<svelte:fragment slot="header">
			<h5 class="modal-title">Dataset meta properties</h5>
		</svelte:fragment>
		<svelte:fragment slot="body">
			<ul class="list-group">
				{#if Object.keys(dataset.meta).length > 0}
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
				{:else}
					<p>No meta properties</p>
				{/if}
			</ul>
		</svelte:fragment>
	</Modal>
	<Modal id="datasetHistoryModal" size="xl" centered={true} scrollable={true}>
		<svelte:fragment slot="header">
			<h5 class="modal-title">Dataset history</h5>
		</svelte:fragment>
		<svelte:fragment slot="body">
			<ul class="list-group">
				{#if dataset.history && Object.keys(dataset.history).length > 0}
					{#each Object.entries(dataset.history) as [key, value]}
						<li class="list-group-item text-bg-light">
							<span>
								Task "{value.workflowtask.task.name}", status "{value.status}"
							</span>
						</li>
						<li class="list-group-item text-break">
							<code><pre>{formatDatasetHistory(value)}</pre></code>
						</li>
					{/each}
				{:else}
					<p>No history</p>
				{/if}
			</ul>
		</svelte:fragment>
	</Modal>
{/if}

<style type="text/css">
	pre {
		white-space: pre-wrap;
		display: inline;
	}
</style>
