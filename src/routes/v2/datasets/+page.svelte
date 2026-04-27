<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import Paginator from '$lib/components/common/Paginator.svelte';
	import { onMount, tick } from 'svelte';
	import { pushState } from '$app/navigation';
	import TimestampCell from '$lib/components/jobs/TimestampCell.svelte';

	/** @type {import('fractal-components/types/api').Pagination<import('fractal-components/types/api').DatasetV2Expanded>} */
	let datasetPage = $state({
		current_page: 1,
		page_size: 10,
		total_count: 0,
		items: [],
		email_list: []
	});

	// query parametes
	/** @type {string|undefined} */
	let projectName = $state(undefined);
	/** @type {boolean} */
	let onlyOwned = $state(false);
	/** @type {string|undefined} */
	let datasetName = $state(undefined);
	/** @type {number} */
	let currentPage = $state(1);
	/** @type {number} */
	let pageSize = $state(10);

	/**
	 * @typedef {Object} AppliedState
	 * @property {string|undefined} projectName
	 * @property {boolean} onlyOwned
	 * @property {string|undefined} datasetName
	 */

	/** @type {AppliedState} */
	let lastAppliedState = $state({
		projectName: undefined,
		onlyOwned: false,
		datasetName: undefined
	});

	const currentState = $derived({
		projectName,
		onlyOwned,
		datasetName
	});

	const isDefault = $derived(
		projectName === undefined && onlyOwned === false && datasetName === undefined
	);

	const isDirtyFromApplied = $derived(
		currentState.projectName !== lastAppliedState.projectName ||
			currentState.onlyOwned !== lastAppliedState.onlyOwned ||
			currentState.datasetName != lastAppliedState.datasetName
	);

	const applyClass = $derived(isDirtyFromApplied ? 'btn-primary' : 'btn-secondary');
	const resetClass = $derived(!isDefault ? 'btn-warning' : 'btn-secondary');

	onMount(async () => {
		await searchDatasets();
	});

	async function searchDatasets() {
		const url = new URL(window.location.href);
		// Headers
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		// Query parametes
		const params = new URLSearchParams();
		params.set('page', String(currentPage));
		params.set('page_size', String(pageSize));
		params.set('only_owned', String(onlyOwned));
		projectName && params.set('project_name', projectName);
		datasetName && params.set('dataset_name', datasetName);

		await tick();
		pushState(url, {});

		let response = await fetch(`/api/v2/dataset?${params.toString()}`, {
			method: 'GET',
			headers,
			credentials: 'include'
		});
		if (response.ok) {
			datasetPage = await response.json();
		} else {
			throw await getAlertErrorFromResponse(response);
		}
	}
</script>

<div class="container-fluid">
	<div class="container mt-2">
		<div class="card mb-3">
			<div class="card-body">
				<div class="row g-3 align-items-end">
					<div class="col">
						<label for="searchProjectName" class="form-label small text-muted">Project name</label>
						<input
							id="searchProjectName"
							type="text"
							class="form-control form-control-sm"
							bind:value={projectName}
						/>
					</div>

					<div class="col">
						<label for="searchDatasetName" class="form-label small text-muted">Dataset name</label>
						<input
							id="searchDatasetName"
							type="text"
							class="form-control form-control-sm"
							bind:value={datasetName}
						/>
					</div>

					<div class="col-auto">
						<div class="form-check mb-1">
							<input
								id="onlyOwnedCheckbox"
								type="checkbox"
								class="form-check-input"
								bind:checked={onlyOwned}
							/>
							<label class="form-check-label small" for="onlyOwnedCheckbox"> Only owned </label>
						</div>
					</div>

					<div class="col-auto d-flex gap-2">
						<button
							class="btn {applyClass} btn-sm px-3"
							disabled={!isDirtyFromApplied}
							onclick={async () => {
								currentPage = 1;
								lastAppliedState = { ...currentState };
								await searchDatasets();
							}}
						>
							Apply
						</button>
						<button
							class="btn {resetClass} btn-sm px-3"
							disabled={isDefault}
							onclick={async () => {
								currentPage = 1;
								projectName = undefined;
								onlyOwned = false;
								datasetName = undefined;
								lastAppliedState = { ...currentState };
								await searchDatasets();
							}}
						>
							Reset
						</button>
					</div>
				</div>
			</div>
		</div>

		<div class="card mb-3">
			<div class="card-body">
				<div class="table-responsive mt-2">
					<table class="table" id="templates-table">
						<colgroup>
							<col style="width: 25%" />
							<col style="width: 20%" />
							<col style="width: 20%" />
							<col style="width: 12%" />
							<col style="width: 10%" />
							<col style="width: 13%" />
						</colgroup>
						<thead>
							<tr>
								<th>Dataset</th>
								<th>Project</th>
								<th>Owner</th>
								<th>Zarr dir</th>
								<th># Images</th>
								<th>Created at</th>
							</tr>
						</thead>
						<tbody>
							{#each datasetPage.items as dataset, index (index)}
								<tr>
									<td class="wrap-cell">
										<a href={`/v2/projects/${dataset.project_id}/datasets/${dataset.id}`}>
											{dataset.name}
										</a>
									</td>
									<td class="wrap-cell">
										<a href={`/v2/projects/${dataset.project_id}`}>
											{dataset.project.name}
										</a>
									</td>
									<td class="wrap-cell">{dataset.owner_email}</td>
									<td class="ellipsis-cell">
										<span title={dataset.zarr_dir}>
											{dataset.zarr_dir}
										</span>
									</td>
									<td class="ellipsis-cell">{dataset.image_count}</td>
									<td class="wrap-cell"><TimestampCell timestamp={dataset.timestamp_created} /></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<div>
			<Paginator
				{currentPage}
				{pageSize}
				totalCount={datasetPage.total_count}
				onPageChange={async (a, b) => {
					currentPage = a;
					pageSize = b;
					await searchDatasets();
				}}
			/>
		</div>
	</div>
</div>

<style>
	.ellipsis-cell {
		max-width: 100px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.wrap-cell {
		white-space: normal;
		word-break: break-word;
	}
</style>
