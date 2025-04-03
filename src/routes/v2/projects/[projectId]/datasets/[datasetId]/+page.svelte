<script>
	import { page } from '$app/stores';
	import DatasetInfoModal from '$lib/components/v2/projects/datasets/DatasetInfoModal.svelte';
	import DatasetHistoryModal from '$lib/components/v2/projects/datasets/DatasetHistoryModal.svelte';
	import { env } from '$env/dynamic/public';
	import DatasetImagesTable from '$lib/components/v2/projects/datasets/DatasetImagesTable.svelte';
	import { onMount } from 'svelte';
	import { encodePathForUrl } from '$lib/common/component_utilities';

	const vizarrViewerUrl = env.PUBLIC_FRACTAL_VIZARR_VIEWER_URL
		? env.PUBLIC_FRACTAL_VIZARR_VIEWER_URL.replace(/\/$|$/, '/')
		: null;

	let projectId = $page.params.projectId;

	/** @type {import('fractal-components/types/api').DatasetV2} */
	let dataset = $page.data.dataset;
	/** @type {import('fractal-components/types/api').ImagePage} */
	let imagePage = $page.data.imagePage;

	/** @type {DatasetImagesTable} */
	let imagesTable;

	$: plates = Array.isArray(imagePage.attributes['plate'])
		? imagePage.attributes['plate'].sort()
		: [];
	let selectedPlate = '';
	let platePath = '';
	let platePathLoading = false;
	let platePathError = '';

	$: if (plates.length > 0 && selectedPlate !== '') {
		computePlatePath();
	} else {
		platePath = '';
		platePathError = '';
	}

	async function computePlatePath() {
		platePathError = '';
		if (!plates.includes(selectedPlate)) {
			selectedPlate = '';
			return;
		}
		let imageWithPlate = imagePage.items.find((i) => i.attributes['plate'] === selectedPlate);
		if (!imageWithPlate) {
			platePathLoading = true;
			imageWithPlate = await loadImageForSelectedPlate();
			platePathLoading = false;
		}
		if (imageWithPlate) {
			// Removes the last 3 elements from the path
			platePath = imageWithPlate.zarr_url.split('/').slice(0, -3).join('/');
			if (!platePath) {
				platePathError = `Unable to load plate URL from zarr URL ${imageWithPlate.zarr_url}`;
			}
		} else {
			platePath = '';
			platePathError = 'Unable to load plate URL. No image found for the selected plate.';
		}
	}

	/**
	 * @returns {Promise<import('fractal-components/types/api').Image|undefined>}
	 */
	async function loadImageForSelectedPlate() {
		const params = { attribute_filters: { plate: [selectedPlate] } };
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(
			`/api/v2/project/${projectId}/dataset/${dataset.id}/images/query?page=1&page_size=1`,
			{
				method: 'POST',
				headers,
				credentials: 'include',
				body: JSON.stringify(params)
			}
		);
		if (!response.ok) {
			console.error(`Unable to load image for plate ${selectedPlate}`);
			return undefined;
		}
		/** @type {import('fractal-components/types/api').ImagePage}*/
		const result = await response.json();
		if (result.items.length === 0) {
			console.error(
				`Unable to load image for plate ${selectedPlate}. Server replied with empty list`
			);
			return undefined;
		}
		return result.items[0];
	}

	async function handleExportDataset() {
		const response = await fetch(
			`/api/v2/project/${dataset.project_id}/dataset/${dataset.id}/export`,
			{
				method: 'GET',
				credentials: 'include'
			}
		);

		if (!response.ok) {
			console.error(await response.json());
			return;
		}

		const datasetData = await response.json();

		if (datasetData !== null) {
			const file = new File(
				[JSON.stringify(datasetData, null, 2)],
				`dataset-export-${dataset.name}-${Date.now().toString()}.json`,
				{
					type: `application/json`
				}
			);
			const fileUrl = URL.createObjectURL(file);
			const linkElement = /** @type {HTMLAnchorElement} */ (
				document.getElementById('downloadDatasetButton')
			);
			linkElement.download = `dataset-export-${dataset.name}-${Date.now().toString()}.json`;
			linkElement.href = fileUrl;
			linkElement.click();
		}
	}

	onMount(() => {
		imagesTable.load();
	});
</script>

<div class="d-flex justify-content-between align-items-center">
	<nav aria-label="breadcrumb">
		<ol class="breadcrumb">
			<li class="breadcrumb-item" aria-current="page">
				<a href="/v2/projects">Projects</a>
			</li>
			<li class="breadcrumb-item" aria-current="page">
				<a href="/v2/projects/{projectId}">{dataset.project.name}</a>
			</li>
			<li class="breadcrumb-item" aria-current="page">Datasets</li>
			<li class="breadcrumb-item active" aria-current="page">{dataset.name}</li>
		</ol>
	</nav>
	<div>
		<button class="btn btn-light" data-bs-target="#datasetInfoModal" data-bs-toggle="modal">
			Info
		</button>
		<button class="btn btn-light" data-bs-target="#datasetHistoryModal" data-bs-toggle="modal">
			History
		</button>
		<button
			class="btn btn-light"
			on:click|preventDefault={handleExportDataset}
			aria-label="Export dataset"
		>
			<i class="bi-download" />
		</button>
		<a id="downloadDatasetButton" class="d-none">Download dataset link</a>
	</div>
</div>

{#if vizarrViewerUrl && plates.length > 0}
	<div class="border border-info rounded bg-light p-3 mt-2">
		<div class="row mb-2">
			<div class="col">
				This dataset contains {plates.length}
				{plates.length === 1 ? 'plate' : 'plates'}. Select which plate you want to view
			</div>
		</div>
		<div class="row row-cols-md-auto g-3 align-items-center">
			<div class="col-12">
				<select class="form-select" aria-label="Select plate" bind:value={selectedPlate}>
					<option value="">Select...</option>
					{#each plates as plate}
						<option>{plate}</option>
					{/each}
				</select>
			</div>
			<div class="col-12">
				{#if platePath}
					<a
						href="{vizarrViewerUrl}?source={vizarrViewerUrl}data{encodePathForUrl(platePath)}"
						class="btn btn-info me-2"
						target="_blank"
						class:disabled={platePathLoading}
					>
						<i class="bi bi-eye" />
						View plate
					</a>
				{:else if platePathError}
					<span class="text-danger">{platePathError}</span>
				{/if}
				{#if platePathLoading}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
				{/if}
			</div>
		</div>
	</div>
{/if}

<div id="datasetUpdateError" />

<DatasetImagesTable
	{dataset}
	bind:imagePage
	{vizarrViewerUrl}
	runWorkflowModal={false}
	bind:this={imagesTable}
/>

<DatasetInfoModal {dataset} updateDatasetCallback={(d) => (dataset = d)} />
<DatasetHistoryModal {dataset} />
