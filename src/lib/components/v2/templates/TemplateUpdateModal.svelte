<script>
	import { FormErrorHandler } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import { normalizePayload } from 'fractal-components';

	/**
	 * @typedef {Object} Props
	 * @property {() => Promise<void>} onTemplateSave
	 */
	/** @type {Props} */
	let { onTemplateSave} = $props();

	/** @type {Modal|undefined} */
	let modal = $state();
	
	/**
	 * @type {import('fractal-components/types/api').WorkflowTemplate|undefined}
	 */
	let template = $state()

	let saving = $state(false);


    const formErrorHandler = new FormErrorHandler(
        'errorAlert-updateTemplateModal', ['user_group_id', 'description']
    );

	/**
	 * @param {number} template_id
	 */
	export async function open(template_id) {
		saving = false;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(
			`/api/v2/workflow_template/${template_id}`,
			{
				method: 'GET',
				headers,
			}
		);
		if (response.ok) {
            template = await response.json()
			modal?.show();
		} else {
			await formErrorHandler.handleErrorResponse(response);
		}

	}
	    
    async function updateTemplate() {
		saving = true;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(
			`/api/v2/workflow_template/${template.id}`,
			{
				method: 'PATCH',
				headers,
				body: normalizePayload({
					user_group_id: template?.user_group_id,
					description: template?.description
				})
			}
		);
		if (response.ok) {
            await onTemplateSave();
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
		EDIT Workflow Template {template?.id}
	</h5>
	{/snippet}
	{#snippet body()}
		{#if template}
			<div class="row mb-3 has-validation">
				<label
					class="col-3 col-lg-2 col-form-label"
					for="template-user-group-id"
				> User Group ID </label>
				<div class="col col-lg-10">
					<input
						type="number"
						class="form-control"
						bind:value={template.user_group_id}
						id="template-user-group-id"
					/>
				</div>
			</div>
			<div class="row mb-3 has-validation">
				<label
					class="col-3 col-lg-2 col-form-label"
					for="template-description"
				> Description </label>
				<div class="col col-lg-10">
					<input
						type="text"
						class="form-control"
						bind:value={template.description}
						id="template-description"
					/>
				</div>
			</div>
			{/if}
			{/snippet}
			{#snippet footer()}
			<button class="btn btn-primary" onclick={updateTemplate} disabled={saving}>
				{#if saving}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
				{/if}
				Save
			</button>
			<button class="btn btn-danger" data-bs-dismiss="modal" type="button">Cancel</button>
			{/snippet}
</Modal>
