<script>
	import { page } from '$app/state';
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import Paginator from '$lib/components/common/Paginator.svelte';
	import { onMount, tick } from 'svelte';
	import { pushState } from '$app/navigation';
	import TimestampCell from '$lib/components/jobs/TimestampCell.svelte';

	/** @type {import('fractal-components/types/api').Pagination<import('fractal-components/types/api').DatasetWithImageCount>} */
	let datasetPage = $state({
		current_page: 1,
		page_size: 10,
		total_count: 0,
		items: [],
		email_list: []
	});

	// query parametes
	/** @type {number|undefined} */
	let projectId = $derived(
		page.url.searchParams.get('project_id')
			? Number(page.url.searchParams.get('template_id'))
			: undefined
	);
	/** @type {string|undefined} */
	let projectName = $derived(page.url.searchParams.get('project_name') || undefined);
	/** @type {boolean} */
	let onlyOwned = $derived(page.url.searchParams.get('only_owned') === 'true');
	/** @type {string|undefined} */
	let datasetName = $derived(page.url.searchParams.get('dataset_name') || undefined);
	/** @type {number} */
	let currentPage = $state(1);
	/** @type {number} */
	let pageSize = $state(10);

	/**
	 * @typedef {Object} AppliedState
	 * @property {number|undefined} projectId
	 * @property {string|undefined} projectName
	 * @property {boolean} onlyOwned
	 * @property {string|undefined} datasetName
	 */

	/** @type {AppliedState} */
	let lastAppliedState = $state({
		projectId: undefined,
		projectName: undefined,
		onlyOwned: false,
		datasetName: undefined
	});

	const currentState = $derived({
		projectId,
		projectName,
		onlyOwned,
		datasetName
	});

	const isDefault = $derived(
		projectId === undefined &&
			projectName === undefined &&
			onlyOwned === false &&
			datasetName === undefined
	);

	const isDirtyFromApplied = $derived(
		currentState.projectId != lastAppliedState.projectId ||
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

		projectId && params.set('project_id', String(projectId));
		projectName && params.set('project_name', projectName);
		onlyOwned
			? url.searchParams.set('only_owned', String(onlyOwned))
			: url.searchParams.delete('only_owned');
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
						<label for="searchProjectId" class="form-label small text-muted">Project ID</label>
						<input
							id="searchProjectId"
							type="number"
							class="form-control form-control-sm"
							min="1"
							bind:value={projectId}
						/>
					</div>

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
								projectId = undefined;
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
						<thead>
							<tr>
								<th>Dataset name</th>
								<th>Project ID</th>
								<th>Zarr dir</th>
								<th>Number of images</th>
								<th>Created at</th>
							</tr>
						</thead>
						<tbody>
							{#each datasetPage.items as dataset, index (index)}
								<tr>
									<td>
										<a href={`/v2/projects/${dataset.project_id}/datasets/${dataset.id}`}>
											{dataset.name}
										</a>
									</td>
									<td>
										<a href={`/v2/projects/${dataset.project_id}`}>
											{dataset.project.name}
										</a>
									</td>
									<td>{dataset.zarr_dir}</td>
									<td>{dataset.image_count}</td>
									<td><TimestampCell timestamp={dataset.timestamp_created} /></td>
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
