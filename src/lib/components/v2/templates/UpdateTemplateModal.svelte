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

    /** @type {number|undefined} */
	let template_id = $state();
    /** @type {number|null} */
	let user_group_id = $state(null);
    /** @type {string|null} */
	let description = $state(null);

	let saving = $state(false);

    const formErrorHandler = new FormErrorHandler(
        'errorAlert-updateTemplateModal', ['user_group_id', 'description']
    );


	/**
	 * @param {import('fractal-components/types/api').WorkflowTemplate} template
	*/
	export function openForEditing(template) {
		saving = false;
        template_id = template.id;
        user_group_id = template.user_group_id;
		description = template.description;
		modal?.show();
	}

	    
    async function updateTemplate() {
		saving = true;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const response = await fetch(
			`/api/v2/workflow_template/${template_id}`,
			{
				method: 'PATCH',
				headers,
				body: normalizePayload({
					user_group_id: user_group_id,
					description: description
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
			Edit workflow template
		</h5>
	{/snippet}
	{#snippet body()}
		<div class="row mb-3 has-validation">
            <div class="col col-lg-10">
				<input
					type="number"
					class="form-control"
					bind:value={user_group_id}
					id="template-user-group-id"
				/>
			</div>
			<div class="col col-lg-10">
				<input
					type="text"
					class="form-control"
					bind:value={description}
					id="template-description"
				/>
			</div>
		</div>
	{/snippet}
	{#snippet footer()}
		<button class="btn btn-primary" onclick={updateTemplate} disabled={saving}>
			{#if saving}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
			{/if}
			Save
		</button>
		<button class="btn btn-secondary" data-bs-dismiss="modal" type="button">Cancel</button>
	{/snippet}
</Modal>
