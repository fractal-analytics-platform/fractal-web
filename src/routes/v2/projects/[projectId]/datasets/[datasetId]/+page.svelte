<script>
	import { page } from '$app/stores';
	import { AlertError, displayStandardErrorAlert } from '$lib/common/errors';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import Paginator from '$lib/components/common/Paginator.svelte';
	import DatasetFiltersModal from '$lib/components/v2/projects/datasets/DatasetFiltersModal.svelte';
	import DatasetInfoModal from '$lib/components/v2/projects/datasets/DatasetInfoModal.svelte';
	import DatasetHistoryModal from '$lib/components/v2/projects/datasets/DatasetHistoryModal.svelte';
	import AddImageModal from '$lib/components/v2/projects/datasets/AddImageModal.svelte';
	import BooleanIcon from '$lib/components/common/BooleanIcon.svelte';

	let projectId = $page.params.projectId;

	/** @type {import('$lib/types-v2').DatasetV2} */
	let dataset = $page.data.dataset;
	/** @type {import('$lib/types-v2').ImagePage} */
	let imagePage = $page.data.imagePage;
	let searching = false;

	let pathFilter = '';
	/** @type {{ [key: string]: {value: string, type: string, error: string }}} */
	let attributeFilters = getAttributeFilterBaseValues(imagePage);
	/** @type {{ [key: string]: boolean | null }}} */
	let flagFilters = getFlagFilterBaseValues(imagePage);
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;
	let useDatasetFilters = false;

	/** @param {import('$lib/types-v2').ImagePage} imagePage */
	function getAttributeFilterBaseValues(imagePage) {
		/** @type {{ [key: string] : {value: string, type: string, error: string }}} */
		let baseFilters = {};
		for (const attributeKey of Object.keys(imagePage.attributes)) {
			baseFilters[attributeKey] = { value: '', type: 'string', error: '' };
		}
		return baseFilters;
	}

	/** @param {import('$lib/types-v2').ImagePage} imagePage */
	function getFlagFilterBaseValues(imagePage) {
		/** @type {{ [key: string]: null | boolean }} */
		let baseFilters = {};
		for (const flagKey of imagePage.flags) {
			baseFilters[flagKey] = null;
		}
		return baseFilters;
	}

	/**
	 * @param {string} imagePath
	 * @returns {string}
	 */
	function getRelativePath(imagePath) {
		if (!imagePath.startsWith(dataset.zarr_dir)) {
			return imagePath;
		}
		const relativePath = imagePath.substring(dataset.zarr_dir.length);
		if (relativePath.startsWith('/')) {
			return relativePath.substring(1);
		}
		return relativePath;
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
		resetAttributeFiltersErrors();
		errorAlert?.hide();
		const valid = validateAttributeFilters();
		if (!valid) {
			return;
		}
		searching = true;
		const params = {};
		if (pathFilter) {
			params['path'] = pathFilter;
		}
		let attributes = {};
		for (const attributeKey of Object.keys(imagePage.attributes)) {
			const filter = attributeFilters[attributeKey];
			if (filter.value) {
				attributes[attributeKey] = getTypedValue(filter);
			}
		}
		if (Object.entries(attributes).length > 0) {
			params['attributes'] = attributes;
		}
		let flags = {};
		for (const flagKey of imagePage.flags) {
			const flag = flagFilters[flagKey];
			if (flag !== null) {
				flags[flagKey] = flag;
			}
		}
		if (Object.entries(flags).length > 0) {
			params['flags'] = flags;
		}
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
		searching = false;
		const result = await response.json();
		if (response.ok) {
			imagePage = result;
			attributeFilters = getAttributeFilterBaseValues(imagePage);
			flagFilters = getFlagFilterBaseValues(imagePage);
		} else {
			errorAlert = displayStandardErrorAlert(result, 'searchError');
		}
	}

	function resetAttributeFiltersErrors() {
		for (const attributeKey of Object.keys(imagePage.attributes)) {
			const filter = attributeFilters[attributeKey];
			filter.error = '';
		}
		// trigger attributeFilters update
		attributeFilters = attributeFilters;
	}

	function validateAttributeFilters() {
		let validFilters = true;
		for (const attributeKey of Object.keys(imagePage.attributes)) {
			const filter = attributeFilters[attributeKey];
			if (filter.value) {
				if (filter.type === 'number' && !filter.value.match(/^\d+\.*\d*$/)) {
					filter.error = 'Invalid number';
					validFilters = false;
					continue;
				}
			}
		}
		return validFilters;
	}

	/**
	 * @param {{ value: string, type: string }} filter
	 * @returns {string | number}
	 */
	function getTypedValue(filter) {
		switch (filter.type) {
			case 'string':
				return filter.value;
			case 'number':
				return parseFloat(filter.value);
			default:
				throw new Error(`Unsupported type: ${filter.type}`);
		}
	}

	async function resetSearchFields() {
		pathFilter = '';
		attributeFilters = getAttributeFilterBaseValues(imagePage);
		flagFilters = getFlagFilterBaseValues(imagePage);
		await searchImages();
	}

	/**
	 * Removes all the characters that can't be used as HTML element id
	 * @param {string} imagePath
	 * @returns {string}
	 */
	function getIdFromPath(imagePath) {
		return imagePath.replaceAll(/[^\w]/g, '');
	}

	/**
	 * @param  {string} imagePath
	 */
	async function handleDeleteImage(imagePath) {
		const response = await fetch(
			`/api/v2/project/${projectId}/dataset/${dataset.id}/images?path=${encodeURIComponent(
				imagePath
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
			throw new AlertError(await response.json());
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
	</div>
</div>

<div>
	<div class="row mt-4 pt-2">
		<div class="col-3 col-md-2 col-lg-1">Zarr dir</div>
		<div class="col-5"><code>{dataset.zarr_dir}</code></div>
		<div class="col">
			<button
				class="btn btn-outline-secondary float-end"
				data-bs-target="#datasetAddImageModal"
				data-bs-toggle="modal"
			>
				<i class="bi bi-plus-circle" />
				Add an image list entry
			</button>
		</div>
	</div>
	<div class="row mt-3">
		<label class="col-3 col-md-2 col-lg-1 col-form-label" for="path_filter"> Path </label>
		<div class="col col-md-8 col-lg-6">
			<input type="text" class="form-control" bind:value={pathFilter} id="path_filter" />
		</div>
	</div>
	<div class="row row-cols-lg-auto">
		{#each Object.keys(imagePage.attributes) as attributeKey}
			<div class="col-12 mt-3">
				<div class="input-group" class:has-validation={attributeFilters[attributeKey].error}>
					<span class="input-group-text">{attributeKey}</span>
					<input
						type="text"
						class="form-control"
						bind:value={attributeFilters[attributeKey].value}
						aria-label="Value for {attributeKey}"
						class:is-invalid={attributeFilters[attributeKey].error}
					/>
					<select
						class="form-control"
						bind:value={attributeFilters[attributeKey].type}
						aria-label="Type for {attributeKey}"
					>
						<option value="string">String</option>
						<option value="number">Number</option>
					</select>
					{#if attributeFilters[attributeKey].error}
						<div class="invalid-feedback">{attributeFilters[attributeKey].error}</div>
					{/if}
				</div>
			</div>
		{/each}
		{#each imagePage.flags as flagKey}
			<div class="col-12 mt-3">
				<div class="input-group">
					<span class="input-group-text">{flagKey}</span>
					<select
						class="form-control"
						bind:value={flagFilters[flagKey]}
						aria-label="Value for {flagKey}"
					>
						<option value={null}>Select...</option>
						<option value={true}>True</option>
						<option value={false}>False</option>
					</select>
				</div>
			</div>
		{/each}
	</div>
	<div class="row mb-4">
		<div class="col mt-4">
			<div id="searchError" class="mb-2" />
			<button class="btn btn-primary" on:click={() => searchImages()} disabled={searching}>
				{#if searching}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
				{:else}
					<i class="bi bi-search" />
				{/if}
				Search images
			</button>
			<button class="btn btn-warning" on:click={resetSearchFields} disabled={searching}>
				Reset
			</button>
		</div>
	</div>

	<div class="table-responsive">
		{#if imagePage.images.length > 0}
			<table class="table" id="dataset-images-table">
				<thead>
					<tr>
						<th>Path</th>
						{#each Object.keys(imagePage.attributes) as attributeKey}
							<th>{attributeKey}</th>
						{/each}
						{#each imagePage.flags as flagKey}
							<th>{flagKey}</th>
						{/each}
						<th>Options</th>
					</tr>
				</thead>
				<tbody>
					{#each imagePage.images as image}
						<tr>
							<td>{getRelativePath(image.path)}</td>
							{#each Object.keys(imagePage.attributes) as attribute}
								<td>{image.attributes[attribute] || ''}</td>
							{/each}
							{#each imagePage.flags as flagKey}
								<td><BooleanIcon value={image.flags[flagKey]} /></td>
							{/each}
							<td class="col-2">
								<ConfirmActionButton
									modalId={'deleteConfirmImageModal-' + getIdFromPath(image.path)}
									style={'danger'}
									btnStyle="danger"
									buttonIcon="trash"
									label={'Delete'}
									message="Delete image {image.path}"
									callbackAction={() => handleDeleteImage(image.path)}
								/>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
	<div class="sticky-bottom pb-2" id="dataset-filters-wrapper">
		<input
			type="radio"
			class="btn-check"
			name="filters-switch"
			id="all-images"
			autocomplete="off"
			value={false}
			bind:group={useDatasetFilters}
			on:change={() => searchImages()}
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
			on:change={() => searchImages()}
		/>
		<label class="btn btn-white btn-outline-primary" for="dataset-filters">Dataset filters</label>
	</div>
	<Paginator
		currentPage={imagePage.current_page}
		pageSize={imagePage.page_size}
		totalCount={imagePage.total_count}
		onPageChange={searchImages}
	/>
</div>

<DatasetInfoModal {dataset} />
<DatasetFiltersModal {dataset} />
<DatasetHistoryModal {dataset} />
<AddImageModal {dataset} onImageSave={searchImages} />

<style>
	#dataset-images-table td:first-child,
	#dataset-images-table td:last-child {
		white-space: nowrap;
	}

	#dataset-filters-wrapper {
		display: inline-block;
	}

	.btn-check:not(:checked) + .btn-white {
		color: #0d6efd;
		background-color: #fff;
	}
</style>
