<script>
	import { page } from '$app/stores';
	import { AlertError, displayStandardErrorAlert } from '$lib/common/errors';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import Paginator from '$lib/components/common/Paginator.svelte';

	let projectId = $page.params.projectId;
	/** @type {import('$lib/types-v2').DatasetV2} */
	let dataset = $page.data.dataset;
	/** @type {import('$lib/types-v2').ImagePage} */
	let imagePage = $page.data.imagePage;
	let searching = false;

	let pathFilter = '';
	/** @type {{ [key: string] : {value: string, type: string, error: string }}} */
	let attributeFilters = getAttributeFilterBaseValues(imagePage);
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/** @param {import('$lib/types-v2').ImagePage} imagePage */
	function getAttributeFilterBaseValues(imagePage) {
		/** @type {{ [key: string] : {value: string, type: string, error: string }}} */
		let baseFilters = {};
		for (const attributeKey of imagePage.attributes) {
			baseFilters[attributeKey] = { value: '', type: 'string', error: '' };
		}
		return baseFilters;
	}

	/**
	 * @param {string} imagePath
	 * @returns {string}
	 */
	function getRelativePath(imagePath) {
		const relativePath = imagePath.substring(dataset.zarr_dir.length);
		if (relativePath.startsWith('/')) {
			return relativePath.substring(1);
		}
		return relativePath;
	}

	/**
	 * @param {number} currentPage
	 * @param {number} pageSize
	 */
	async function searchImages(currentPage, pageSize) {
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
		for (const attributeKey of imagePage.attributes) {
			const filter = attributeFilters[attributeKey];
			if (filter.value) {
				attributes[attributeKey] = getTypedValue(filter);
			}
		}
		if (Object.entries(attributes).length > 0) {
			params['attributes'] = attributes;
		}
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(
			`/api/v2/project/${projectId}/dataset/${dataset.id}/images/query?page=${currentPage}&page_size=${pageSize}`,
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
		} else {
			errorAlert = displayStandardErrorAlert(result, 'searchError');
		}
	}

	function resetAttributeFiltersErrors() {
		for (const attributeKey of imagePage.attributes) {
			const filter = attributeFilters[attributeKey];
			filter.error = '';
		}
		// trigger attributeFilters update
		attributeFilters = attributeFilters;
	}

	function validateAttributeFilters() {
		let validFilters = true;
		for (const attributeKey of imagePage.attributes) {
			const filter = attributeFilters[attributeKey];
			if (filter.value) {
				if (filter.type === 'boolean' && filter.value !== 'true' && filter.value !== 'false') {
					filter.error = 'Invalid boolean value: use "true" or "false"';
					validFilters = false;
					continue;
				}
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
	 * @returns {string | number | boolean}
	 */
	function getTypedValue(filter) {
		switch (filter.type) {
			case 'string':
				return filter.value;
			case 'number':
				return parseFloat(filter.value);
			case 'boolean':
				return filter.value === 'true';
			default:
				throw new Error(`Unsupported type: ${filter.type}`);
		}
	}

	function resetSearchFields() {
		pathFilter = '';
		attributeFilters = getAttributeFilterBaseValues(imagePage);
		searchImages(imagePage.current_page, imagePage.page_size);
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
			searchImages(imagePage.current_page, imagePage.page_size);
		} else {
			throw new AlertError(await response.json());
		}
	}
</script>

<nav aria-label="breadcrumb">
	<ol class="breadcrumb">
		<li class="breadcrumb-item">
			<a href="/v2/projects">Projects</a>
		</li>
		<li class="breadcrumb-item">
			<a href="/v2/projects/{projectId}">{dataset.project.name}</a>
		</li>
		<li class="breadcrumb-item">Datasets</li>
		<li class="breadcrumb-item">
			<a href="/v2/projects/{projectId}/datasets/{dataset.id}">{dataset.name}</a>
		</li>
		<li class="breadcrumb-item active" aria-current="page">Images</li>
	</ol>
</nav>

<div>
	<div class="row mt-4 pt-2">
		<div class="col-3 col-md-2 col-lg-1">Zarr dir</div>
		<div class="col"><code>{dataset.zarr_dir}</code></div>
	</div>
	<div class="row mt-3">
		<label class="col-3 col-md-2 col-lg-1 col-form-label" for="path_filter"> Path </label>
		<div class="col col-md-8 col-lg-6">
			<input type="text" class="form-control" bind:value={pathFilter} id="path_filter" />
		</div>
	</div>
	{#each imagePage.attributes as attributeKey}
		<div class="row mt-3">
			<div class="col col-md-7 col-lg-5">
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
						<option value="boolean">Boolean</option>
					</select>
					{#if attributeFilters[attributeKey].error}
						<div class="invalid-feedback">{attributeFilters[attributeKey].error}</div>
					{/if}
				</div>
			</div>
		</div>
	{/each}
	<div class="row mb-4">
		<div class="col mt-4">
			<div id="searchError" class="mb-2" />
			<button
				class="btn btn-primary"
				on:click={() => searchImages(imagePage.current_page, imagePage.page_size)}
				disabled={searching}
			>
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

	{#if imagePage.images.length > 0}
		<table class="table">
			<thead>
				<tr>
					<th>Path</th>
					{#each imagePage.attributes as attribute}
						<th>{attribute}</th>
					{/each}
					<th>Options</th>
				</tr>
			</thead>
			<tbody>
				{#each imagePage.images as image}
					<tr>
						<td>{getRelativePath(image.path)}</td>
						{#each imagePage.attributes as attribute}
							<td>{image.attributes[attribute]}</td>
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
	<Paginator
		currentPage={imagePage.current_page}
		pageSize={imagePage.page_size}
		totalCount={imagePage.total_count}
		onPageChange={searchImages}
	/>
</div>
