<script>
	import { FormErrorHandler } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import { normalizePayload } from 'fractal-components';
	import ImageAttributesTypesForm from './ImageAttributesTypesForm.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').DatasetV2} dataset
	 * @property {() => Promise<void>} onImageSave
	 */

	/** @type {Props} */
	let { dataset, onImageSave } = $props();

	/** @type {Modal|undefined} */
	let modal = $state();

	let zarr_url = $state('');
	let saving = $state(false);
	let isNew = $state(false);

	/** @type {ImageAttributesTypesForm|undefined} */
	let attributesTypesForm = $state();

	const formErrorHandler = new FormErrorHandler('errorAlert-datasetCreateUpdateImageModal', [
		'zarr_url'
	]);

	const validationErrors = formErrorHandler.getValidationErrorStore();

	export function openForCreate() {
		isNew = true;
		saving = false;
		zarr_url = dataset.zarr_dir;
		if (!zarr_url.endsWith('/')) {
			zarr_url += '/';
		}
		attributesTypesForm?.init({}, {});
		formErrorHandler.clearErrors();
		modal?.show();
	}

	/**
	 * @param {import('fractal-components/types/api').Image} image
	 */
	export function openForEditing(image) {
		isNew = false;
		saving = false;
		zarr_url = image.zarr_url;
		attributesTypesForm?.init(image.attributes, image.types);
		formErrorHandler.clearErrors();
		modal?.show();
	}

	async function saveImage() {
		formErrorHandler.clearErrors();
		if (isNew) {
			await createNewImage();
		} else {
			await updateImage();
		}
	}

	async function createNewImage() {
		saving = true;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(
			`/api/v2/project/${dataset.project_id}/dataset/${dataset.id}/images`,
			{
				method: 'POST',
				headers,
				body: normalizePayload({
					zarr_url,
					attributes: attributesTypesForm?.getAttributes(),
					types: attributesTypesForm?.getTypes()
				})
			}
		);
		if (response.ok) {
			await onImageSave();
			modal?.hide();
		} else {
			await formErrorHandler.handleErrorResponse(response);
		}
		saving = false;
	}

	async function updateImage() {
		saving = true;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(
			`/api/v2/project/${dataset.project_id}/dataset/${dataset.id}/images`,
			{
				method: 'PATCH',
				headers,
				body: normalizePayload({
					zarr_url,
					attributes: attributesTypesForm?.getAttributes(),
					types: attributesTypesForm?.getTypes()
				})
			}
		);
		if (response.ok) {
			await onImageSave();
			modal?.hide();
		} else {
			await formErrorHandler.handleErrorResponse(response);
		}
		saving = false;
	}
</script>

<Modal
	id="datasetCreateUpdateImageModal"
	size="lg"
	centered={true}
	scrollable={true}
	bind:this={modal}
>
	{#snippet header()}
		<h5 class="modal-title">
			{#if isNew}
				Add an image list entry
			{:else}
				Edit an image list entry
			{/if}
		</h5>
	{/snippet}
	{#snippet body()}
		<div class="row mb-3 has-validation">
			<label class="col-3 col-lg-2 col-form-label" for="image-zarr-url"> Zarr URL </label>
			<div class="col col-lg-10">
				<input
					type="text"
					class="form-control"
					bind:value={zarr_url}
					class:is-invalid={$validationErrors['zarr_url']}
					disabled={!isNew}
					id="image-zarr-url"
				/>
				<span class="invalid-feedback">{$validationErrors['zarr_url']}</span>
			</div>
		</div>
		<ImageAttributesTypesForm bind:this={attributesTypesForm} />
		<div id="errorAlert-datasetCreateUpdateImageModal" class="mt-3"></div>
	{/snippet}
	{#snippet footer()}
		<button class="btn btn-primary" onclick={saveImage} disabled={saving}>
			{#if saving}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
			{/if}
			Save
		</button>
		<button class="btn btn-secondary" data-bs-dismiss="modal" type="button">Cancel</button>
	{/snippet}
</Modal>
