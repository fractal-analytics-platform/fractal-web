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

	/** @type {string|undefined} */
	let groupName = $state()

	/**
	 * @param {number} template_id
	 */
	export async function open(template_id) {
		const response = await fetch(
			`/api/v2/workflow-template/${template_id}`,
			{ method: 'GET' }
		);
		if (response.ok) {
            template = await response.json()
			if (template?.user_group_id) {
				const response2 = await fetch(
					`/api/auth/current-user?group_ids_names=true`,
					{ method: 'GET' }
				);
				if (response2.ok) {
					const res = await response2.json()
					groupName = res.group_ids_names.find(([id]) => id === template?.user_group_id)?.[1] ?? undefined;
					if (!groupName) {
						throw new Error(`User group ${template?.user_group_id} not found`);
					}
				} else {
					await formErrorHandler.handleErrorResponse(response2);
				}
			}
			modal?.show();
		} else {
			await formErrorHandler.handleErrorResponse(response);
		}
		
	}

</script>

<Modal
    id="templateInfoModal"
    centered={true}
    scrollable={true}
    bind:this={modal}
    size="lg"
>
		{#snippet header()}
		<h5 class="modal-title">Template '{template?.name}'</h5>
		{/snippet}
		{#snippet body()}
			{#if template}
			<ul class="list-group">
				<li class="list-group-item text-bg-light">
					<strong>Template ID</strong>
				</li>
				<li class="list-group-item">
					<span>{template?.id}</span>
				</li>
				<li class="list-group-item text-bg-light">
					<strong>User email</strong>
				</li>
				<li class="list-group-item">
					<span>{template?.user_email}</span>
				</li>
				<li class="list-group-item text-bg-light">
					<strong>Name</strong>
				</li>
				<li class="list-group-item">
					<span>{template?.name}</span>
				</li>
				<li class="list-group-item text-bg-light">
					<strong>Version</strong>
				</li>
				<li class="list-group-item">
					<span>{template?.version}</span>
				</li>
				<li class="list-group-item text-bg-light">
					<strong>User group</strong>
				</li>
				<li class="list-group-item">
					<span>{template.user_group_id ? groupName : '-'}</span>
				</li>
				<li class="list-group-item text-bg-light">
					<strong>Description</strong>
				</li>
				<li class="list-group-item">
					<span>{template?.description ? template.description : '-'}</span>
				</li>
				<li class="list-group-item text-bg-light">
					<strong>Creation timestamp</strong>
				</li>
				<li class="list-group-item">
					<TimestampCell timestamp={template.timestamp_created} />
				</li>
				<li class="list-group-item text-bg-light">
					<strong>Last use timestamp</strong>
				</li>
				<li class="list-group-item">
					<TimestampCell timestamp={template.timestamp_last_used} />
				</li>
			</ul>
			{/if}
		{/snippet}
	</Modal>
