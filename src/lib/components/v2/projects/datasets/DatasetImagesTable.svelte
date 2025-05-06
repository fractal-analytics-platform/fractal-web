<script>
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import CreateUpdateImageModal from '$lib/components/v2/projects/datasets/CreateUpdateImageModal.svelte';
	import BooleanIcon from 'fractal-components/common/BooleanIcon.svelte';
	import {
		encodePathForUrl,
		hideAllTooltips,
		objectChanged
	} from '$lib/common/component_utilities';
	import SlimSelect from 'slim-select';
	import { onDestroy, tick } from 'svelte';
	import Paginator from '$lib/components/common/Paginator.svelte';
	import { stripNullAndEmptyObjectsAndArrays } from 'fractal-components';
	import CopyToClipboardButton from '$lib/components/common/CopyToClipboardButton.svelte';
	import { browser } from '$app/environment';
	import { getRelativeZarrPath } from '$lib/common/workflow_utilities';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').DatasetV2} dataset
	 * @property {import('fractal-components/types/api').ImagePage} imagePage
	 * @property {Array<string>} [extraTypes] Types not included in the the image page result
	 * @property {string|null} [vizarrViewerUrl]
	 * @property {boolean} [runWorkflowModal] Set to true if the table is displayed inside the "Run workflow" modal. Used to disable some buttons.
	 * @property {{ attribute_filters: { [key: string]: Array<string | number | boolean> | null }, type_filters: { [key: string]: boolean | null }} | null} [initialFilterValues]
	 * @property {Array<string>} [disabledTypes]
	 * @property {(key: string) => void} [beforeTypeSelectionChanged]
	 * @property {Array<string>} [highlightedTypes]
	 * @property {boolean} [imagesStatusModal] Set to true if the table is displayed inside the "Images status" modal.
	 * @property {string} [imagesStatusModalUrl]
	 * @property {import('svelte').Snippet<[import('fractal-components/types/api').Image]>} [extraButtons]
	 */

	/** @type {Props} */
	let {
		dataset,
		imagePage = $bindable(),
		extraTypes = [],
		vizarrViewerUrl = null,
		runWorkflowModal = false,
		initialFilterValues = null,
		disabledTypes = [],
		beforeTypeSelectionChanged = () => {},
		highlightedTypes = [],
		imagesStatusModal = false,
		imagesStatusModalUrl,
		extraButtons
	} = $props();

	let imagesStatusFilter = '';

	let showTable = $state(false);
	let firstLoad = true;

	/** @type {CreateUpdateImageModal|undefined} */
	let imageModal = undefined;

	let searching = $state(false);
	let resetting = $state(false);

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

	/** @type {SlimSelect|undefined} */
	let statusSelector = undefined;
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
		return Object.fromEntries(getTypeKeys(imagePage).map((k) => [k, getInitialTypeFilterValue(k)]));
	}

	/** @param {import('fractal-components/types/api').ImagePage} imagePage */
	function getTypeKeys(imagePage) {
		return [...imagePage.types, ...extraTypes];
	}

	/** @type {{ [key: string]: Array<string | number | boolean> | null }} */
	let lastAppliedAttributeFilters = getAttributeFilterBaseValues(imagePage);
	/** @type {{ [key: string]: boolean | null }}} */
	let lastAppliedTypeFilters = getTypeFilterBaseValues(imagePage);
	let lastAppliedImagesStatusFilter = '';

	const applyBtnActive = $derived(
		attributesChanged(lastAppliedAttributeFilters, attributeFilters) ||
			objectChanged(lastAppliedTypeFilters, typeFilters) ||
			lastAppliedImagesStatusFilter !== imagesStatusFilter
	);

	let resetBtnActive = $state(false);

	export async function applySearchFields() {
		searching = true;
		const params = await searchImages();
		resetBtnActive =
			Object.values(attributeFilters).filter((a) => a !== null).length > 0 ||
			Object.values(typeFilters).filter((t) => t !== null).length > 0 ||
			!!imagesStatusFilter;
		searching = false;
		return params;
	}

	async function resetSearchFields() {
		resetBtnActive = false;
		resetting = true;
		attributeFilters = getAttributeFilterBaseValues(imagePage);
		typeFilters = getTypeFilterBaseValues(imagePage);
		imagesStatusFilter = '';
		await tick();
		await searchImages();
		resetting = false;
	}

	export async function load() {
		attributeFilters = getAttributeFilterBaseValues(imagePage);
		typeFilters = getTypeFilterBaseValues(imagePage);
		await tick();
		await searchImages();
	}

	onDestroy(() => {
		for (const selector of Object.values(attributesSelectors)) {
			selector.destroy();
		}
		for (const selector of Object.values(typesSelectors)) {
			selector.destroy();
		}
		statusSelector?.destroy();
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

	function loadTypesSelectors() {
		// Destroy previous selectors
		for (const selector of Object.values(typesSelectors)) {
			selector.destroy();
		}
		// Init new selectors
		typesSelectors = Object.fromEntries(
			getTypeKeys(imagePage).map((k) => [
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

		for (const [key, typeSelector] of Object.entries(typesSelectors)) {
			if (disabledTypes.includes(key)) {
				typeSelector.disable();
			} else {
				typeSelector.enable();
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
				maxValuesShown: 5,
				showSearch: true,
				allowDeselect: true,
				isMultiple: true,
				closeOnSelect: false,
				ariaLabel: `Selector for attribute ${key}`
			},
			events: {
				beforeChange: () => {
					return true;
				},
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
				maxValuesShown: 5,
				showSearch: false,
				allowDeselect: true,
				ariaLabel: `Selector for type ${key}`
			},
			events: {
				beforeChange: () => {
					beforeTypeSelectionChanged(key);
					return true;
				},
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

	function loadStatusSelector() {
		if (!imagesStatusModal) {
			return;
		}
		const elementId = 'status-selector';
		const selectElement = document.getElementById(elementId);
		if (!selectElement) {
			throw new Error(`Unable to find selector element with id ${elementId}`);
		}
		statusSelector?.destroy();
		selectElement.classList.remove('invisible');
		statusSelector = new SlimSelect({
			select: `#${elementId}`,
			settings: {
				maxValuesShown: 5,
				showSearch: false,
				allowDeselect: true,
				ariaLabel: `Status selector`,
				isMultiple: false
			},
			events: {
				afterChange: (selection) => {
					const selectedOption = selection[0];
					if (!selectedOption || selectedOption.placeholder) {
						imagesStatusFilter = '';
					} else {
						imagesStatusFilter = selectedOption.value;
					}
				}
			}
		});
		setSlimSelectOptions(statusSelector, [
			'done',
			'submitted',
			'failed',
			{ text: 'not processed', value: 'unset' }
		]);
		if (imagesStatusFilter) {
			statusSelector.setSelected(imagesStatusFilter);
		}
	}

	/**
	 * Updates SlimSelect options. This rebuilds the HTML elements and unset the selected value.
	 * @param {SlimSelect|undefined} select
	 * @param {Array<string | { text: string, value: string }>} values
	 */
	function setSlimSelectOptions(select, values) {
		if (!select) {
			return;
		}
		const options = values.map((v) =>
			typeof v === 'string' ? { text: v.toString(), value: v.toString() } : v
		);
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
	 * @returns {Promise<{ attribute_filters: any, type_filters: any }>}
	 */
	export async function searchImages(currentPage = null, pageSize = null) {
		if (currentPage === null) {
			currentPage = imagePage.current_page;
		}
		if (pageSize === null) {
			pageSize = imagePage.page_size;
		}
		errorAlert?.hide();
		hideAllTooltips();
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
		for (const typeKey of getTypeKeys(imagePage)) {
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
		let response;
		if (imagesStatusModal) {
			let url = `${imagesStatusModalUrl}&page=${currentPage}&page_size=${pageSize}`;
			if (imagesStatusFilter) {
				url += `&unit_status=${imagesStatusFilter}`;
			}
			response = await fetch(url, {
				method: 'POST',
				headers,
				body: JSON.stringify(
					stripNullAndEmptyObjectsAndArrays({
						attribute_filters: attributes,
						type_filters: types
					})
				)
			});
		} else {
			response = await fetch(
				`/api/v2/project/${dataset.project_id}/dataset/${dataset.id}/images/query?page=${currentPage}&page_size=${pageSize}`,
				{
					method: 'POST',
					headers,
					credentials: 'include',
					body: JSON.stringify(params)
				}
			);
		}
		if (firstLoad && !runWorkflowModal && !imagesStatusModal) {
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
			loadStatusSelector();
			// Go to first page if the search returns no values and we are not in the first page
			// This happens when we are in a given page and we restrict the search setting more filters
			if (imagePage.items.length === 0 && imagePage.current_page > 1) {
				imagePage.current_page = 1;
				await searchImages();
			}
			lastAppliedAttributeFilters = { ...attributeFilters };
			lastAppliedTypeFilters = { ...typeFilters };
			lastAppliedImagesStatusFilter = imagesStatusFilter;
		} else {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'datasetImagesError'
			);
		}
		return params;
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
			getTypeKeys(imagePage).map((k) => [k, k in typeFilters ? typeFilters[k] : null])
		);
		loadTypesSelectors();
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
			if (imagePage.items.length === 1 && imagePage.current_page > 1) {
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

	$effect(() => {
		if (dataset) {
			resetBtnActive = false;
		}
	});

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

	/**
	 * @param {string} zarrUrl
	 */
	function getUrl(zarrUrl) {
		return `${vizarrViewerUrl}data${encodePathForUrl(zarrUrl)}`;
	}

	onDestroy(() => {
		if (browser) {
			hideAllTooltips();
		}
	});
</script>

{#if !showTable}
	{#if !runWorkflowModal && !imagesStatusModal}
		<div class="container">
			<p class="fw-bold mt-5">No entries in the image list yet</p>
			<button class="btn btn-outline-secondary" onclick={() => imageModal?.openForCreate()}>
				<i class="bi bi-plus-circle"></i>
				Add an image list entry
			</button>
		</div>
	{/if}
{:else}
	<div>
		<div class="container">
			<div id="datasetImagesError" class="mt-2 mb-2"></div>
		</div>

		<div class="table-responsive mt-2">
			<table class="table" id="dataset-images-table">
				<colgroup>
					<col width="auto" />
					{#if imagesStatusModal}
						<col width="190" />
					{/if}
					<!-- eslint-disable-next-line no-unused-vars -->
					{#each Object.keys(imagePage.attributes) as _}
						<col width="190" />
					{/each}
					<!-- eslint-disable-next-line no-unused-vars -->
					{#each getTypeKeys(imagePage) as _}
						<col width="110" />
					{/each}
					<col width="auto" />
				</colgroup>
				<thead>
					<tr>
						<th>Zarr URL</th>
						{#if imagesStatusModal}
							<th>Status</th>
						{/if}
						{#each Object.keys(imagePage.attributes) as attributeKey}
							<th>
								<label class="align-bottom" for="attribute-{getIdFromValue(attributeKey)}">
									{attributeKey}
								</label>
								{#if !imagesStatusModal}
									<button
										class="ps-0 pb-0 btn btn-link"
										onclick={(event) => {
											event.preventDefault();
											toggleAll(attributeKey);
										}}
										title="Toggle all"
										aria-label="Toggle all"
									>
										<i class="bi bi-check-all"></i>
									</button>
								{/if}
							</th>
						{/each}
						{#each getTypeKeys(imagePage) as typeKey}
							<th class:bg-warning-subtle={highlightedTypes.includes(typeKey)}>
								<label for="type-{getIdFromValue(typeKey)}">
									{typeKey}
								</label>
							</th>
						{/each}
						<th>Options</th>
					</tr>
					<tr>
						<th></th>
						{#if imagesStatusModal}
							<th>
								<div class="row">
									<div class="col">
										<div class="status-select-wrapper mb-1">
											<select id="status-selector" class="invisible"></select>
										</div>
									</div>
								</div>
							</th>
						{/if}
						{#each Object.keys(imagePage.attributes) as attributeKey}
							<th>
								<div class="row">
									<div class="col">
										<div class="attribute-select-wrapper mb-1">
											<select id="attribute-{getIdFromValue(attributeKey)}" class="invisible"
											></select>
										</div>
									</div>
								</div>
							</th>
						{/each}
						{#each getTypeKeys(imagePage) as typeKey}
							<th class:bg-warning-subtle={highlightedTypes.includes(typeKey)}>
								<div class="type-select-wrapper mb-1">
									<select id="type-{getIdFromValue(typeKey)}" class="invisible"></select>
								</div>
							</th>
						{/each}
						<th>
							<button
								class="btn"
								onclick={applySearchFields}
								disabled={searching || resetting || !applyBtnActive}
								class:btn-primary={applyBtnActive}
								class:btn-secondary={!applyBtnActive}
							>
								{#if searching}
									<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"
									></span>
								{/if}
								Apply
							</button>
							<button
								class="btn"
								onclick={resetSearchFields}
								disabled={resetting || searching || !resetBtnActive}
								class:btn-warning={resetBtnActive}
								class:btn-secondary={!resetBtnActive}
							>
								{#if resetting}
									<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"
									></span>
								{/if}
								Reset
							</button>
						</th>
					</tr>
				</thead>
				<tbody>
					{#each imagePage.items as image, index}
						<tr>
							<td>{getRelativeZarrPath(dataset, image.zarr_url)}</td>
							{#if imagesStatusModal}
								<td>
									{image.status || '-'}
								</td>
							{/if}
							{#each Object.keys(imagePage.attributes) as attribute}
								<td>
									{#if image.attributes[attribute] !== null && image.attributes[attribute] !== undefined}
										{image.attributes[attribute]}
									{/if}
								</td>
							{/each}
							{#each getTypeKeys(imagePage) as typeKey}
								<td><BooleanIcon value={image.types[typeKey]} /></td>
							{/each}
							<td class="col-2">
								{#if vizarrViewerUrl}
									<a
										class="btn btn-info"
										href="{vizarrViewerUrl}?source={vizarrViewerUrl}data{encodePathForUrl(
											image.zarr_url
										)}"
										target="_blank"
									>
										<i class="bi bi-eye"></i>
										View
									</a>
									{#key imagePage.items}
										<CopyToClipboardButton
											btnClass="light"
											clipboardText={getUrl(image.zarr_url)}
											text="Get URL"
											id="get-url{index}"
										/>
									{/key}
								{/if}
								{#if !runWorkflowModal && !imagesStatusModal}
									<button
										class="btn btn-light"
										onclick={() => imageModal?.openForEditing(image)}
										aria-label="Edit"
									>
										<span class="text-primary">
											<i class="bi bi-pencil"></i>
										</span>
									</button>
									<ConfirmActionButton
										modalId={'deleteConfirmImageModal-' + getIdFromValue(image.zarr_url)}
										style="danger"
										btnStyle="light text-danger"
										buttonIcon="trash"
										ariaLabel={'Delete'}
										callbackAction={() => handleDeleteImage(image.zarr_url)}
									>
										{#snippet body()}
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
										{/snippet}
									</ConfirmActionButton>
								{/if}
								{#if imagesStatusModal}
									{@render extraButtons?.(image)}
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="pb-2 bg-white" class:sticky-bottom={!runWorkflowModal && !imagesStatusModal}>
			<div class="row">
				<div class={!runWorkflowModal && !imagesStatusModal ? 'col-lg-6' : 'col'}>
					<Paginator
						currentPage={imagePage.current_page}
						pageSize={imagePage.page_size}
						totalCount={imagePage.total_count}
						onPageChange={async (currentPage, pageSize) => {
							await searchImages(currentPage, pageSize);
						}}
						singleLine={runWorkflowModal || imagesStatusModal}
					/>
				</div>
				{#if !runWorkflowModal && !imagesStatusModal}
					<div class="col-lg-3">
						<button
							class="btn btn-outline-secondary float-end"
							onclick={() => imageModal?.openForCreate()}
						>
							<i class="bi bi-plus-circle"></i>
							Add an image list entry
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<CreateUpdateImageModal
	{dataset}
	onImageSave={async () => {
		await searchImages();
	}}
	bind:this={imageModal}
/>

<style>
	#dataset-images-table td:last-child,
	#dataset-images-table th:last-child {
		white-space: nowrap;
	}

	#dataset-images-table thead tr:first-child th label {
		word-break: break-all;
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
