<script>
	import { page } from '$app/stores';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import Paginator from '$lib/components/common/Paginator.svelte';
	import DatasetFiltersModal from '$lib/components/v2/projects/datasets/DatasetFiltersModal.svelte';
	import DatasetInfoModal from '$lib/components/v2/projects/datasets/DatasetInfoModal.svelte';
	import DatasetHistoryModal from '$lib/components/v2/projects/datasets/DatasetHistoryModal.svelte';
	import CreateUpdateImageModal from '$lib/components/v2/projects/datasets/CreateUpdateImageModal.svelte';
	import BooleanIcon from '$lib/components/common/BooleanIcon.svelte';
	import SlimSelect from 'slim-select';
	import { onMount, tick } from 'svelte';
	import { objectChanged } from '$lib/common/component_utilities';
	import { env } from '$env/dynamic/public';

	const vizarrViewerUrl = env.PUBLIC_FRACTAL_VIZARR_VIEWER_URL
		? env.PUBLIC_FRACTAL_VIZARR_VIEWER_URL.replace(/\/$|$/, '/')
		: null;

	let projectId = $page.params.projectId;

	/** @type {import('$lib/types-v2').DatasetV2} */
	let dataset = $page.data.dataset;
	/** @type {import('$lib/types-v2').ImagePage} */
	let imagePage = $page.data.imagePage;
	let showTable = $page.data.imagePage.total_count > 0;
	let searching = false;
	let resetting = false;
	let reloading = false;
	/** @type {{ [key: string]: null | string | number | boolean}} */
	let attributeFilters = getAttributeFilterBaseValues(imagePage);
	/** @type {{ [key: string]: boolean | null }}} */
	let typeFilters = getTypeFilterBaseValues(imagePage);
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;
	let useDatasetFilters = false;

	/** @type {{[key: string]: SlimSelect}} */
	let attributesSelectors = {};
	/** @type {{[key: string]: SlimSelect}} */
	let typesSelectors = {};

	/** @type {{ [key: string]: null | string | number | boolean}} */
	let lastAppliedAttributeFilters = getAttributeFilterBaseValues(imagePage);
	/** @type {{ [key: string]: boolean | null }}} */
	let lastAppliedTypeFilters = getTypeFilterBaseValues(imagePage);

	/** @type {CreateUpdateImageModal|undefined} */
	let imageModal = undefined;

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
		let imageWithPlate = imagePage.images.find((i) => i.attributes['plate'] === selectedPlate);
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
	 * @returns {Promise<import('$lib/types-v2').Image|undefined>}
	 */
	async function loadImageForSelectedPlate() {
		const params = { filters: { attributes: { plate: selectedPlate } } };
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
		/** @type {import('$lib/types-v2').ImagePage}*/
		const result = await response.json();
		if (result.images.length === 0) {
			console.error(
				`Unable to load image for plate ${selectedPlate}. Server replied with empty list`
			);
			return undefined;
		}
		return result.images[0];
	}

	onMount(() => {
		loadAttributesSelectors();
		loadTypesSelector();
	});

	function loadAttributesSelectors() {
		// Destroy previous selectors
		for (const selector of Object.values(attributesSelectors)) {
			selector.destroy();
		}
		// Init new selectors
		attributesSelectors = Object.fromEntries(
			Object.keys(imagePage.attributes).map((k) => [
				k,
				loadSelector(
					k,
					imagePage.attributes[k]
						.map((a) => a.toString())
						.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
					(value) => {
						if (value === null) {
							attributeFilters[k] = null;
						} else {
							const values = imagePage.attributes[k];
							attributeFilters[k] = values.filter((v) => value === v.toString())[0];
						}
					},
					attributeFilters[k]?.toString() || '',
					true
				)
			])
		);
	}

	function loadTypesSelector() {
		// Destroy previous selectors
		for (const selector of Object.values(typesSelectors)) {
			selector.destroy();
		}
		// Init new selectors
		typesSelectors = Object.fromEntries(
			imagePage.types.map((k) => [
				k,
				loadSelector(
					k,
					['True', 'False'],
					(value) => {
						if (value === 'True') {
							typeFilters[k] = true;
						} else if (value === 'False') {
							typeFilters[k] = false;
						} else {
							typeFilters[k] = null;
						}
					},
					typeFilters[k] === null ? '' : typeFilters[k] ? 'True' : 'False',
					false
				)
			])
		);
	}

	/**
	 * @param {string} key
	 * @param {string[]} values
	 * @param {(value: string | null) => void} setter
	 * @param {string} selectedValue
	 * @param {boolean} isAttribute
	 */
	function loadSelector(key, values, setter, selectedValue, isAttribute) {
		const elementId = (isAttribute ? 'attribute-' : 'type-') + getIdFromValue(key);
		const selectElement = document.getElementById(elementId);
		if (!selectElement) {
			throw new Error(`Unable to find selector element with key ${key}`);
		}
		selectElement.classList.remove('invisible');
		const selector = new SlimSelect({
			select: `#${elementId}`,
			settings: {
				showSearch: isAttribute,
				allowDeselect: true,
				ariaLabel: isAttribute ? `Selector for attribute ${key}` : `Selector for type ${key}`
			},
			events: {
				afterChange: (selection) => {
					const selectedOption = selection[0];
					if (!selectedOption || selectedOption.placeholder) {
						setter(null);
					} else {
						setter(selectedOption.value);
					}
				}
			}
		});
		setSlimSelectOptions(selector, values);
		selector.setSelected(selectedValue);
		return selector;
	}

	/**
	 * Updates SlimSelect options. This rebuilds the HTML elements and unset the selected value.
	 * @param {SlimSelect|undefined} select
	 * @param {Array<string>} values
	 */
	function setSlimSelectOptions(select, values) {
		if (!select) {
			return;
		}
		const options = values.map((v) => ({ text: v.toString(), value: v.toString() }));
		select.setData([{ text: 'All', placeholder: true }, ...options]);
	}

	$: applyBtnActive =
		objectChanged(lastAppliedAttributeFilters, attributeFilters) ||
		objectChanged(lastAppliedTypeFilters, typeFilters);

	let resetBtnActive = false;

	/** @param {import('$lib/types-v2').ImagePage} imagePage */
	function getAttributeFilterBaseValues(imagePage) {
		return Object.fromEntries(Object.keys(imagePage.attributes).map((k) => [k, null]));
	}

	/** @param {import('$lib/types-v2').ImagePage} imagePage */
	function getTypeFilterBaseValues(imagePage) {
		return Object.fromEntries(imagePage.types.map((k) => [k, null]));
	}

	/**
	 * Reload the attribute filters according to the received imagePage
	 * preserving the values selected by the user
	 * @param {import('$lib/types-v2').ImagePage} imagePage
	 */
	function reloadAttributeFilters(imagePage) {
		attributeFilters = Object.fromEntries(
			Object.keys(imagePage.attributes).map((k) => [
				k,
				k in attributeFilters ? attributeFilters[k] : null
			])
		);
		loadAttributesSelectors();
	}

	/**
	 * Reload the type filters according to the received imagePage
	 * preserving the values selected by the user
	 * @param {import('$lib/types-v2').ImagePage} imagePage
	 */
	function reloadTypeFilters(imagePage) {
		typeFilters = Object.fromEntries(
			imagePage.types.map((k) => [k, k in typeFilters ? typeFilters[k] : null])
		);
		loadTypesSelector();
	}

	/**
	 * @param {string} zarrUrl
	 * @returns {string}
	 */
	function getRelativePath(zarrUrl) {
		if (!zarrUrl.startsWith(dataset.zarr_dir)) {
			return zarrUrl;
		}
		const relativePath = zarrUrl.substring(dataset.zarr_dir.length);
		if (relativePath.startsWith('/')) {
			return relativePath.substring(1);
		}
		return relativePath;
	}

	async function applySearchFields() {
		searching = true;
		await searchImages();
		resetBtnActive =
			Object.values(attributeFilters).filter((a) => a !== null).length > 0 ||
			Object.values(typeFilters).filter((t) => t !== null).length > 0;
		searching = false;
	}

	async function resetSearchFields() {
		resetBtnActive = false;
		resetting = true;
		for (const selector of Object.values(attributesSelectors)) {
			selector.setSelected('');
		}
		attributeFilters = getAttributeFilterBaseValues(imagePage);
		typeFilters = getTypeFilterBaseValues(imagePage);
		await tick();
		await searchImages();
		resetting = false;
	}

	async function reload() {
		reloading = true;
		attributeFilters = getAttributeFilterBaseValues(imagePage);
		typeFilters = getTypeFilterBaseValues(imagePage);
		await tick();
		await searchImages();
		reloading = false;
	}

	/**
	 * @param {number|null} currentPage
	 * @param {number|null} pageSize
	 */
	async function searchImages(currentPage = null, pageSize = null) {
		if (currentPage === null) {
			currentPage = imagePage.current_page;
		}
		if (pageSize === null) {
			pageSize = imagePage.page_size;
		}
		errorAlert?.hide();
		const filters = {};
		let attributes = {};
		for (const attributeKey of Object.keys(imagePage.attributes)) {
			const filter = attributeFilters[attributeKey];
			if (filter) {
				attributes[attributeKey] = filter;
			}
		}
		if (Object.entries(attributes).length > 0) {
			filters['attributes'] = attributes;
		}
		let types = {};
		for (const typeKey of imagePage.types) {
			const typeValue = typeFilters[typeKey];
			if (typeValue !== null) {
				types[typeKey] = typeValue;
			}
		}
		if (Object.entries(types).length > 0) {
			filters['types'] = types;
		}
		const params = { filters };
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(
			`/api/v2/project/${projectId}/dataset/${dataset.id}/images/query?page=${currentPage}&page_size=${pageSize}&use_dataset_filters=${useDatasetFilters}`,
			{
				method: 'POST',
				headers,
				credentials: 'include',
				body: JSON.stringify(params)
			}
		);
		showTable = true;
		if (response.ok) {
			imagePage = await response.json();
			await tick();
			reloadAttributeFilters(imagePage);
			reloadTypeFilters(imagePage);
			// Go to first page if the search returns no values and we are not in the first page
			// This happens when we are in a given page and we restrict the search setting more filters
			if (imagePage.images.length === 0 && imagePage.current_page > 1) {
				imagePage.current_page = 1;
				await searchImages();
			}
			lastAppliedAttributeFilters = { ...attributeFilters };
			lastAppliedTypeFilters = { ...typeFilters };
		} else {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'searchError'
			);
		}
	}

	/**
	 * Removes all the characters that can't be used as HTML element id
	 * @param {string} value
	 * @returns {string}
	 */
	function getIdFromValue(value) {
		return value.replaceAll(/[^\w]/g, '');
	}

	/**
	 * @param  {string} zarrUrl
	 */
	async function handleDeleteImage(zarrUrl) {
		const response = await fetch(
			`/api/v2/project/${projectId}/dataset/${dataset.id}/images?zarr_url=${encodeURIComponent(
				zarrUrl
			)}`,
			{
				method: 'DELETE',
				credentials: 'include'
			}
		);
		if (response.ok) {
			// If we are deleting the last image of the current page go to previous page
			if (imagePage.images.length === 1 && imagePage.current_page > 1) {
				imagePage.current_page--;
			}
			await searchImages();
		} else {
			throw await getAlertErrorFromResponse(response);
		}
	}

	/**
	 * @param {import('$lib/types-v2').DatasetV2} updatedDataset
	 */
	async function updateDatasetFiltersCallback(updatedDataset) {
		dataset = updatedDataset;
		if (useDatasetFilters) {
			await reload();
		}
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
		<button class="btn btn-light" data-bs-target="#datasetFiltersModal" data-bs-toggle="modal">
			Filters
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
						href="{vizarrViewerUrl}?source={vizarrViewerUrl}data{platePath}"
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

{#if !showTable}
	<p class="fw-bold ms-4 mt-5">No entries in the image list yet</p>
	<button class="btn btn-outline-secondary ms-4" on:click={() => imageModal?.openForCreate()}>
		<i class="bi bi-plus-circle" />
		Add an image list entry
	</button>
{:else}
	<div>
		<div class="row">
			<div class="col">
				<div id="searchError" class="mt-2 mb-2" />
			</div>
		</div>

		<div class="table-responsive mt-2">
			<table class="table" id="dataset-images-table">
				<colgroup>
					<col width="auto" />
					<!-- eslint-disable-next-line no-unused-vars -->
					{#each Object.keys(imagePage.attributes) as _}
						<col width="190" />
					{/each}
					<!-- eslint-disable-next-line no-unused-vars -->
					{#each imagePage.types as _}
						<col width="110" />
					{/each}
					<col width="auto" />
				</colgroup>
				<thead>
					<tr>
						<th>Zarr URL</th>
						{#each Object.keys(imagePage.attributes) as attributeKey}
							<th>
								<label for="attribute-{getIdFromValue(attributeKey)}">
									{attributeKey}
								</label>
							</th>
						{/each}
						{#each imagePage.types as typeKey}
							<th>
								<label for="type-{getIdFromValue(typeKey)}">
									{typeKey}
								</label>
							</th>
						{/each}
						<th>Options</th>
					</tr>
					<tr>
						<th />
						{#each Object.keys(imagePage.attributes) as attributeKey}
							<th>
								<div class="row">
									<div class="col">
										<div class="attribute-select-wrapper mb-1">
											<select id="attribute-{getIdFromValue(attributeKey)}" class="invisible" />
										</div>
									</div>
								</div>
							</th>
						{/each}
						{#each imagePage.types as typeKey}
							<th>
								<div class="type-select-wrapper mb-1">
									<select id="type-{getIdFromValue(typeKey)}" class="invisible" />
								</div>
							</th>
						{/each}
						<th>
							<button
								class="btn"
								on:click={applySearchFields}
								disabled={searching || resetting || !applyBtnActive}
								class:btn-primary={applyBtnActive}
								class:btn-secondary={!applyBtnActive}
							>
								{#if searching}
									<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
								{/if}
								Apply
							</button>
							<button
								class="btn"
								on:click={resetSearchFields}
								disabled={resetting || searching || !resetBtnActive}
								class:btn-warning={resetBtnActive}
								class:btn-secondary={!resetBtnActive}
							>
								{#if resetting}
									<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
								{/if}
								Reset
							</button>
						</th>
					</tr>
				</thead>
				<tbody>
					{#each imagePage.images as image}
						<tr>
							<td>{getRelativePath(image.zarr_url)}</td>
							{#each Object.keys(imagePage.attributes) as attribute}
								<td>
									{#if image.attributes[attribute] !== null && image.attributes[attribute] !== undefined}
										{image.attributes[attribute]}
									{/if}
								</td>
							{/each}
							{#each imagePage.types as typeKey}
								<td><BooleanIcon value={image.types[typeKey]} /></td>
							{/each}
							<td class="col-2">
								{#if vizarrViewerUrl}
									<a
										class="btn btn-info"
										href="{vizarrViewerUrl}?source={vizarrViewerUrl}data{image.zarr_url}"
										target="_blank"
									>
										<i class="bi bi-eye" />
										View
									</a>
								{/if}
								<button class="btn btn-primary" on:click={() => imageModal?.openForEditing(image)}>
									<i class="bi bi-pencil" />
									Edit
								</button>
								<ConfirmActionButton
									modalId={'deleteConfirmImageModal-' + getIdFromValue(image.zarr_url)}
									style={'danger'}
									btnStyle="danger"
									buttonIcon="trash"
									label={'Delete'}
									callbackAction={() => handleDeleteImage(image.zarr_url)}
								>
									<svelte:fragment slot="body">
										<div class="alert alert-danger fw-semibold wrap">
											The following image is about to be removed from the Fractal image list:<br />
											{image.zarr_url}
										</div>
										<p class="fw-semibold wrap">
											This does not remove the actual image data from disk, it just removes it from
											the Fractal database
										</p>
										<p>Do you confirm?</p>
									</svelte:fragment>
								</ConfirmActionButton>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="sticky-bottom pb-2" id="dataset-filters-wrapper">
			<div class="row">
				<div class="col-lg-3 mb-3">
					<input
						type="radio"
						class="btn-check"
						name="filters-switch"
						id="all-images"
						autocomplete="off"
						value={false}
						bind:group={useDatasetFilters}
						on:change={reload}
						disabled={reloading || searching || resetting}
					/>
					<label class="btn btn-white btn-outline-primary" for="all-images">All images</label>
					<input
						type="radio"
						class="btn-check"
						name="filters-switch"
						id="dataset-filters"
						autocomplete="off"
						value={true}
						bind:group={useDatasetFilters}
						on:change={reload}
						disabled={reloading || searching || resetting}
					/>
					<label class="btn btn-white btn-outline-primary" for="dataset-filters">
						Dataset filters
					</label>
					{#if reloading}
						<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
					{/if}
				</div>
				<div class="col-lg-6">
					<Paginator
						currentPage={imagePage.current_page}
						pageSize={imagePage.page_size}
						totalCount={imagePage.total_count}
						onPageChange={searchImages}
					/>
				</div>
				<div class="col-lg-3">
					<button
						class="btn btn-outline-secondary float-end"
						on:click={() => imageModal?.openForCreate()}
					>
						<i class="bi bi-plus-circle" />
						Add an image list entry
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<DatasetInfoModal {dataset} updateDatasetCallback={(d) => (dataset = d)} />
<DatasetFiltersModal {dataset} updateDatasetCallback={updateDatasetFiltersCallback} />
<DatasetHistoryModal {dataset} />
<CreateUpdateImageModal {dataset} onImageSave={searchImages} bind:this={imageModal} />

<style>
	#dataset-images-table td:last-child,
	#dataset-images-table th:last-child {
		white-space: nowrap;
	}

	#dataset-images-table thead tr:first-child th label {
		word-break: break-all;
	}

	#dataset-filters-wrapper {
		background-color: #fff;
	}

	.btn-check:not(:checked) + .btn-white {
		color: #0d6efd;
		background-color: #fff;
	}

	.wrap {
		white-space: normal;
	}

	.attribute-select-wrapper {
		min-width: 180px;
		max-width: 180px;
	}

	.type-select-wrapper {
		min-width: 100px;
		max-width: 100px;
	}
</style>
