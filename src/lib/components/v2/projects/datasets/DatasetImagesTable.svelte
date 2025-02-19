<script>
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import CreateUpdateImageModal from '$lib/components/v2/projects/datasets/CreateUpdateImageModal.svelte';
	import Paginator from '$lib/components/common/Paginator.svelte';
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';
	import { deepCopy, objectChanged } from '$lib/common/component_utilities';
	import SlimSelect from 'slim-select';
	import { onDestroy, tick } from 'svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';

	/** @type {import('fractal-components/types/api').DatasetV2} */
	export let dataset;
	/** @type {import('fractal-components/types/api').ImagePage} */
	export let imagePage;
	/** @type {string|null} */
	export let vizarrViewerUrl;
	/** @type {boolean} */
	export let useDatasetFilters;
	/**
	 * Set to true if the table is displayed inside the "Run workflow" modal.
	 * Used to disable some buttons.
	 * @type {boolean}
	 */
	export let runWorkflowModal;
	export let attributeFiltersEnabled = true;
	/** @type {{ attribute_filters: { [key: string]: Array<string | number | boolean> | null }, type_filters: { [key: string]: boolean | null }} | null} */
	export let initialFilterValues = null;

	let datasetFiltersChanged = false;
	/** @type {(dataset: import('fractal-components/types/api').DatasetV2) => void} */
	export let onDatasetsUpdated = () => {};

	let showTable = false;
	let firstLoad = true;

	/** @type {Tooltip|undefined} */
	let currentSelectionTooltip;

	/** @type {CreateUpdateImageModal|undefined} */
	let imageModal = undefined;

	let searching = false;
	let resetting = false;
	let savingDatasetFilters = false;

	let loading = false;
	/** @type {{ [key: string]: Array<string | number | boolean> | null}} */
	let attributeFilters = {};

	export function getAttributeFilters() {
		return removeNullValues(attributeFilters);
	}

	export function getTypeFilters() {
		return removeNullValues(typeFilters);
	}

	/** @type {{ [key: string]: boolean | null }}} */
	let typeFilters = {};
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/** @type {{[key: string]: SlimSelect}} */
	let attributesSelectors = {};
	/** @type {{[key: string]: SlimSelect}} */
	let typesSelectors = {};

	/**
	 * @param {string} key
	 */
	function getInitialAttributeFilterValue(key) {
		if (initialFilterValues === null) {
			return null;
		}
		const value = initialFilterValues.attribute_filters[key];
		if (value === undefined) {
			return null;
		}
		return value;
	}

	/**
	 * @param {string} key
	 * @returns {boolean|null}
	 */
	function getInitialTypeFilterValue(key) {
		if (initialFilterValues === null) {
			return null;
		}
		const value = initialFilterValues.type_filters[key];
		return value === true || value === false ? value : null;
	}

	/** @param {import('fractal-components/types/api').ImagePage} imagePage */
	function getAttributeFilterBaseValues(imagePage) {
		return Object.fromEntries(
			Object.keys(imagePage.attributes).map((k) => [k, getInitialAttributeFilterValue(k)])
		);
	}

	/** @param {import('fractal-components/types/api').ImagePage} imagePage */
	function getTypeFilterBaseValues(imagePage) {
		return Object.fromEntries(imagePage.types.map((k) => [k, getInitialTypeFilterValue(k)]));
	}

	/** @type {{ [key: string]: Array<string | number | boolean> | null }} */
	let lastAppliedAttributeFilters = getAttributeFilterBaseValues(imagePage);
	/** @type {{ [key: string]: boolean | null }}} */
	let lastAppliedTypeFilters = getTypeFilterBaseValues(imagePage);

	$: applyBtnActive =
		attributesChanged(lastAppliedAttributeFilters, attributeFilters) ||
		objectChanged(lastAppliedTypeFilters, typeFilters);

	let resetBtnActive = false;

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

	export async function applySearchFields() {
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
		if (useDatasetFilters) {
			attributeFilters = deepCopy(dataset.attribute_filters);
			typeFilters = deepCopy(dataset.type_filters);
		} else {
			attributeFilters = getAttributeFilterBaseValues(imagePage);
			typeFilters = getTypeFilterBaseValues(imagePage);
		}
		await tick();
		await searchImages();
		resetting = false;
	}

	export async function load() {
		loading = true;
		currentSelectionTooltip?.setEnabled(!useDatasetFilters);
		if (useDatasetFilters) {
			attributeFilters = deepCopy(dataset.attribute_filters);
			typeFilters = deepCopy(dataset.type_filters);
		} else {
			attributeFilters = getAttributeFilterBaseValues(imagePage);
			typeFilters = getTypeFilterBaseValues(imagePage);
		}
		await tick();
		await searchImages();
		loading = false;
	}

	onDestroy(() => {
		for (const selector of Object.values(attributesSelectors)) {
			selector.destroy();
		}
		for (const selector of Object.values(typesSelectors)) {
			selector.destroy();
		}
		attributesSelectors = {};
		typesSelectors = {};
		attributeFilters = {};
		typeFilters = {};
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
				loadAttributeSelector(
					k,
					imagePage.attributes[k]
						.map((a) => a.toString())
						.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
					(value) => {
						attributeFilters[k] = value === null ? null : value.length > 0 ? value : null;
					},
					attributeFilters[k] === null || attributeFilters[k] === undefined
						? []
						: attributeFilters[k].map((v) => v.toString())
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
				loadTypeSelector(
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
					typeFilters[k] === null ? '' : typeFilters[k] ? 'True' : 'False'
				)
			])
		);

		if (runWorkflowModal) {
			if (!attributeFiltersEnabled) {
				// disable attribute filters selection
				for (const attributeSelector of Object.values(attributesSelectors)) {
					attributeSelector.disable();
				}
			}
			// disable type filters selection
			for (const typeSelector of Object.values(typesSelectors)) {
				typeSelector.disable();
			}
		}
	}

	/**
	 * @param {string} key
	 * @param {string[]} values
	 * @param {(value: Array<string | boolean | number> | null) => void} setter
	 * @param {string[]} selectedValues
	 */
	function loadAttributeSelector(key, values, setter, selectedValues) {
		const elementId = 'attribute-' + getIdFromValue(key);
		const selectElement = document.getElementById(elementId);
		if (!selectElement) {
			throw new Error(`Unable to find selector element with key ${key}`);
		}
		selectElement.classList.remove('invisible');
		selectElement.setAttribute('multiple', 'multiple');
		const selector = new SlimSelect({
			select: `#${elementId}`,
			settings: {
				showSearch: true,
				allowDeselect: true,
				isMultiple: true,
				closeOnSelect: false,
				ariaLabel: `Selector for attribute ${key}`
			},
			events: {
				afterChange: (selection) => {
					const value = selection.map((s) => s.value);
					setter(getTypedValues(key, value));
				}
			}
		});
		setSlimSelectOptions(selector, values);
		selector.setSelected(selectedValues);
		return selector;
	}

	/**
	 * @param {string} key
	 * @param {string[]} values
	 * @param {(value: string | null) => void} setter
	 * @param {string} selectedValue
	 */
	function loadTypeSelector(key, values, setter, selectedValue) {
		const elementId = 'type-' + getIdFromValue(key);
		const selectElement = document.getElementById(elementId);
		if (!selectElement) {
			throw new Error(`Unable to find selector element with key ${key}`);
		}
		selectElement.classList.remove('invisible');
		const selector = new SlimSelect({
			select: `#${elementId}`,
			settings: {
				showSearch: false,
				allowDeselect: true,
				ariaLabel: `Selector for type ${key}`
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

	/**
	 * Reload the attribute filters according to the received imagePage
	 * preserving the values selected by the user
	 * @param {import('fractal-components/types/api').ImagePage} imagePage
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
		const params = {};
		let attributes = {};
		for (const attributeKey of Object.keys(imagePage.attributes)) {
			const filter = attributeFilters[attributeKey];
			if (filter) {
				attributes[attributeKey] = filter;
			}
		}
		if (Object.entries(attributes).length > 0) {
			params.attribute_filters = attributes;
		}
		let types = {};
		for (const typeKey of imagePage.types) {
			const typeValue = typeFilters[typeKey];
			if (typeValue !== null) {
				types[typeKey] = typeValue;
			}
		}
		if (Object.entries(types).length > 0) {
			params.type_filters = types;
		}
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(
			`/api/v2/project/${dataset.project_id}/dataset/${dataset.id}/images/query?page=${currentPage}&page_size=${pageSize}`,
			{
				method: 'POST',
				headers,
				credentials: 'include',
				body: JSON.stringify(params)
			}
		);
		if (firstLoad && !runWorkflowModal) {
			showTable = imagePage.total_count > 0;
			firstLoad = false;
		} else {
			showTable = true;
		}
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
				'datasetImagesError'
			);
		}
	}

	/**
	 * @param {string} key
	 * @param {string[]} values
	 * @returns {Array<string | boolean | number> | null}
	 */
	function getTypedValues(key, values) {
		const allValues = imagePage.attributes[key];
		if (!allValues || allValues.length === 0) {
			return null;
		}
		if (values.length === 0) {
			return null;
		}
		const firstValue = allValues[0];
		if (typeof firstValue === 'number') {
			return values.map((v) => parseFloat(v));
		} else if (typeof firstValue === 'boolean') {
			return values.map((v) => v === 'true');
		}
		return values;
	}

	/**
	 * Reload the type filters according to the received imagePage
	 * preserving the values selected by the user
	 * @param {import('fractal-components/types/api').ImagePage} imagePage
	 */
	function reloadTypeFilters(imagePage) {
		typeFilters = Object.fromEntries(
			imagePage.types.map((k) => [k, k in typeFilters ? typeFilters[k] : null])
		);
		loadTypesSelector();
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
	 * @param {string} zarrUrl
	 */
	async function handleDeleteImage(zarrUrl) {
		const response = await fetch(
			`/api/v2/project/${dataset.project_id}/dataset/${
				dataset.id
			}/images?zarr_url=${encodeURIComponent(zarrUrl)}`,
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
	 * @param {string} attributeKey
	 */
	function toggleAll(attributeKey) {
		const selector = attributesSelectors[attributeKey];
		const values = imagePage.attributes[attributeKey];
		if (!selector || !values) {
			return;
		}
		if (selector.getSelected().length === values.length) {
			selector.setSelected([]);
		} else {
			selector.setSelected(values.map((v) => v.toString()));
		}
	}

	$: if (attributeFilters && typeFilters) {
		datasetFiltersChanged =
			!applyBtnActive &&
			(attributesChanged(dataset.attribute_filters, removeNullValues(attributeFilters)) ||
				objectChanged(dataset.type_filters, removeNullValues(typeFilters)));
	}

	$: if (dataset) {
		resetBtnActive = false;
	}

	/**
	 * @param {{ [key: string]: any }} map
	 */
	function removeNullValues(map) {
		return Object.fromEntries(Object.entries(map).filter(([, v]) => v !== null));
	}

	/**
	 * @param {{ [key: string]: null | Array<string | number | boolean> }} oldObject
	 * @param {{ [key: string]: null | Array<string | number | boolean> }} newObject
	 */
	function attributesChanged(oldObject, newObject) {
		if (Object.keys(oldObject).length !== Object.keys(newObject).length) {
			return true;
		}
		for (const [oldKey, oldValue] of Object.entries(oldObject)) {
			if (!(oldKey in newObject)) {
				return true;
			}
			const newValue = newObject[oldKey];
			if (Array.isArray(oldValue) && Array.isArray(newValue)) {
				if (oldValue.length !== newValue.length) {
					return true;
				}
				for (const ov of oldValue) {
					if (!newValue.includes(ov)) {
						return true;
					}
				}
			} else if (oldValue !== newValue) {
				return true;
			}
		}
		return false;
	}

	async function saveDatasetFilters() {
		errorAlert?.hide();
		savingDatasetFilters = true;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(`/api/v2/project/${dataset.project_id}/dataset/${dataset.id}`, {
			method: 'PATCH',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				attribute_filters: getAttributeFilters(),
				type_filters: getTypeFilters()
			})
		});
		if (response.ok) {
			const result = await response.json();
			dataset = result;
			onDatasetsUpdated(dataset);
		} else {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'datasetImagesError'
			);
		}
		savingDatasetFilters = false;
	}
</script>

{#if !showTable}
	<p class="fw-bold ms-4 mt-5">No entries in the image list yet</p>
	{#if !runWorkflowModal}
		<button class="btn btn-outline-secondary ms-4" on:click={() => imageModal?.openForCreate()}>
			<i class="bi bi-plus-circle" />
			Add an image list entry
		</button>
	{/if}
{:else}
	<div>
		<div class="row">
			<div class="col">
				<div id="datasetImagesError" class="mt-2 mb-2" />
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
								<button
									class="ps-0 btn btn-link"
									on:click|preventDefault={() => toggleAll(attributeKey)}
									title="Toggle all"
								>
									<i class="bi bi-check-all" />
								</button>
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
							{#if !runWorkflowModal && useDatasetFilters}
								<ConfirmActionButton
									modalId="confirmSaveDatasetFilters"
									label="Save"
									message="Save dataset filters"
									disabled={!datasetFiltersChanged || savingDatasetFilters}
									callbackAction={async () => {
										await saveDatasetFilters();
									}}
								/>
							{/if}
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
								{#if !runWorkflowModal}
									<button
										class="btn btn-primary"
										on:click={() => imageModal?.openForEditing(image)}
									>
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
												The following image is about to be removed from the Fractal image list:<br
												/>
												{image.zarr_url}
											</div>
											<p class="fw-semibold wrap">
												This does not remove the actual image data from disk, it just removes it
												from the Fractal database
											</p>
											<p>Do you confirm?</p>
										</svelte:fragment>
									</ConfirmActionButton>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="pb-2" id="dataset-filters-wrapper" class:sticky-bottom={!runWorkflowModal}>
			<div class="row">
				<div class="col-lg-3 mb-3">
					{#if !runWorkflowModal}
						<input
							type="radio"
							class="btn-check"
							name="filters-switch"
							id="all-images"
							autocomplete="off"
							value={false}
							bind:group={useDatasetFilters}
							on:change={load}
							disabled={loading || searching || resetting}
						/>
						<label class="btn btn-white btn-outline-primary" for="all-images">All images</label>
						<Tooltip
							id="current-selection-label"
							title="These are default selection for images on which a workflow will be run"
							placement="bottom"
							bind:this={currentSelectionTooltip}
						>
							<input
								type="radio"
								class="btn-check"
								name="filters-switch"
								id="current-selection"
								autocomplete="off"
								value={true}
								bind:group={useDatasetFilters}
								on:change={load}
								disabled={loading || searching || resetting}
							/>
							<label class="btn btn-white btn-outline-primary" for="current-selection">
								Current selection
							</label>
						</Tooltip>
						{#if loading}
							<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
						{/if}
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
				{#if !runWorkflowModal}
					<div class="col-lg-3">
						<button
							class="btn btn-outline-secondary float-end"
							on:click={() => imageModal?.openForCreate()}
						>
							<i class="bi bi-plus-circle" />
							Add an image list entry
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

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
