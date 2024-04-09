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
	let showSearchForm = $page.data.imagePage.total_count > 0;
	let searching = false;
	let zarrUrlFilter = '';
	/** @type {{ [key: string]: null | string | number}} */
	let attributeFilters = getAttributeFilterBaseValues(imagePage);
	/** @type {{ [key: string]: boolean | null }}} */
	let typeFilters = getTypeFilterBaseValues(imagePage);
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;
	let useDatasetFilters = false;

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
		searching = true;
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
		if (zarrUrlFilter) {
			params['zarr_url'] = zarrUrlFilter;
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
		showSearchForm = true;
		const result = await response.json();
		if (response.ok) {
			imagePage = result;
			reloadAttributeFilters(imagePage);
			reloadTypeFilters(imagePage);
			// Go to first page if the search returns no values and we are not in the first page
			// This happens when we are in a given page and we restrict the search setting more filters
			if (imagePage.images.length === 0 && imagePage.current_page > 1) {
				imagePage.current_page = 1;
				await searchImages();
			}
		} else {
			errorAlert = displayStandardErrorAlert(result, 'searchError');
		}
	}

	async function resetSearchFields() {
		zarrUrlFilter = '';
		attributeFilters = getAttributeFilterBaseValues(imagePage);
		typeFilters = getTypeFilterBaseValues(imagePage);
		await searchImages();
	}

	/**
	 * Removes all the characters that can't be used as HTML element id
	 * @param {string} zarrUrl
	 * @returns {string}
	 */
	function getIdFromZarrURL(zarrUrl) {
		return zarrUrl.replaceAll(/[^\w]/g, '');
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

{#if !showSearchForm}
	<p class="fw-bold ms-4 mt-5">No entries in the image list yet</p>
	<button
		class="btn btn-outline-secondary ms-4"
		data-bs-target="#datasetAddImageModal"
		data-bs-toggle="modal"
	>
		<i class="bi bi-plus-circle" />
		Add an image list entry
	</button>
{:else}
	<div>
		<div class="row mt-4 pt-2">
			<label class="col-3 col-md-2 col-lg-1 col-form-label" for="zarr_url_filter"> Zarr URL </label>
			<div class="col col-md-8 col-lg-6">
				<input type="text" class="form-control" bind:value={zarrUrlFilter} id="zarr_url_filter" />
			</div>
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
		<div class="row row-cols-lg-auto">
			{#each Object.keys(imagePage.attributes) as attributeKey}
				<div class="col-12 mt-3">
					<div class="input-group">
						<span class="input-group-text">{attributeKey}</span>
						<select
							class="form-control"
							bind:value={attributeFilters[attributeKey]}
							aria-label="Value for {attributeKey}"
						>
							<option value={null}>Select...</option>
							{#each imagePage.attributes[attributeKey] as value}
								<option {value}>{value}</option>
							{/each}
						</select>
					</div>
				</div>
			{/each}
			{#each imagePage.types as typeKey}
				<div class="col-12 mt-3">
					<div class="input-group">
						<span class="input-group-text">{typeKey}</span>
						<select
							class="form-control"
							bind:value={typeFilters[typeKey]}
							aria-label="Value for {typeKey}"
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
							<th>Zarr URL</th>
							{#each Object.keys(imagePage.attributes) as attributeKey}
								<th>{attributeKey}</th>
							{/each}
							{#each imagePage.types as typeKey}
								<th>{typeKey}</th>
							{/each}
							<th>Options</th>
						</tr>
					</thead>
					<tbody>
						{#each imagePage.images as image}
							<tr>
								<td>{getRelativePath(image.zarr_url)}</td>
								{#each Object.keys(imagePage.attributes) as attribute}
									<td>{image.attributes[attribute] || ''}</td>
								{/each}
								{#each imagePage.types as typeKey}
									<td><BooleanIcon value={image.types[typeKey]} /></td>
								{/each}
								<td class="col-2">
									<ConfirmActionButton
										modalId={'deleteConfirmImageModal-' + getIdFromZarrURL(image.zarr_url)}
										style={'danger'}
										btnStyle="danger"
										buttonIcon="trash"
										label={'Delete'}
										message="Delete image {image.zarr_url}"
										callbackAction={() => handleDeleteImage(image.zarr_url)}
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
{/if}

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
