<script>
	import { page } from '$app/stores';
	import Modal from '$lib/components/common/Modal.svelte';

	let projectId = $page.params.projectId;

	/** @type {import('$lib/types-v2').DatasetV2 | undefined} */
	let dataset = $page.data.dataset;

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
				<a href="/v2/projects">Projects</a>
			</li>
			{#if dataset}
				<li class="breadcrumb-item" aria-current="page">
					<a href="/v2/projects/{projectId}">{dataset.project.name}</a>
				</li>
				<li class="breadcrumb-item" aria-current="page">Datasets</li>
				<li class="breadcrumb-item active" aria-current="page">{dataset.name}</li>
			{/if}
		</ol>
	</nav>
	<div>
		{#if dataset}
			<a href="/v2/projects/{projectId}/datasets/{dataset.id}/images" class="btn btn-light">
				<i class="bi-arrow-up-right-square" />
				Images
			</a>
			<button class="btn btn-light" data-bs-target="#datasetHistoryModal" data-bs-toggle="modal">
				<i class="bi-arrow-up-right-square" />
				Show dataset history
			</button>
		{/if}
	</div>
</div>

{#if dataset}
	<div>
		<div class="row mt-2">
			<div class="col-4">
				<div class="d-flex align-items-center justify-content-between">
					<h3 class="fw-light mt-1">Dataset properties</h3>
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
						<strong>Zarr dir</strong>
					</li>
					<li class="list-group-item">
						<span>{dataset.zarr_dir}</span>
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
					<h3 class="fw-light mt-1">Filters</h3>
				</div>
				<table class="table table-bordered caption-top align-middle">
					<thead class="bg-light">
						<tr>
							<th class="col-4">Key</th>
							<th class="col">Value</th>
						</tr>
					</thead>
					<tbody>
						{#each Object.entries(dataset.filters) as [filterKey, filterValue]}
							<tr>
								<td>{filterKey}</td>
								<td class="text-break"><code>{filterValue}</code></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
{/if}

{#if dataset}
	<Modal id="datasetHistoryModal" size="xl" centered={true} scrollable={true}>
		<svelte:fragment slot="header">
			<h5 class="modal-title">Dataset history</h5>
		</svelte:fragment>
		<svelte:fragment slot="body">
			<ul class="list-group">
				{#if dataset.history && Object.keys(dataset.history).length > 0}
					{#each Object.entries(dataset.history) as [, value]}
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
