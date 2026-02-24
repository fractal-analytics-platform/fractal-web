<script>
	import { FormErrorHandler } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import TimestampCell from '$lib/components/jobs/TimestampCell.svelte';


	/**
	 * @type {import('fractal-components/types/api').WorkflowTemplate|undefined}
	 */
	let template = $state()

	/** @type {Modal|undefined} */
	let modal = $state();

	const formErrorHandler = new FormErrorHandler(
        'errorAlert-updateTemplateModal', ['user_group_id', 'description']
    );

	/**
	 * @param {number} template_id
	 */
	export async function open(template_id) {
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

</script>

{#if template}
<Modal
    id="templateInfoModal"
    centered={true}
    scrollable={true}
    bind:this={modal}
    size="lg"
>
		{#snippet header()}
			<h5 class="modal-title">Workflow Template {template.id}</h5>
		{/snippet}
		{#snippet body()}
			<ul class="list-group">
			<li class="list-group-item text-bg-light">
					<strong>User email</strong>
				</li>
				<li class="list-group-item">
					<span>{template.user_email}</span>
				</li>
				<li class="list-group-item text-bg-light">
					<strong>Name</strong>
				</li>
				<li class="list-group-item">
					<span>{template.name}</span>
				</li>
				<li class="list-group-item text-bg-light">
					<strong>Version</strong>
				</li>
				<li class="list-group-item">
					<span>{template.version}</span>
				</li>
				<li class="list-group-item text-bg-light">
					<strong>User Group</strong>
				</li>
				<li class="list-group-item">
					<span>{template.user_group_id ? template.user_group_id : '-'}</span>
				</li>
				<li class="list-group-item text-bg-light">
					<strong>Description</strong>
				</li>
				<li class="list-group-item">
					<span>{template.description ? template.description : '-'}</span>
				</li>
				<li class="list-group-item text-bg-light">
					<strong>Creation timestamp</strong>
				</li>
				<li class="list-group-item">
					<TimestampCell timestamp={template.timestamp_created} />
				</li>
			</ul>
		{/snippet}
	</Modal>
{/if}
