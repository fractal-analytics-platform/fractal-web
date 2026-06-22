<script>
	import { AlertError, getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '$lib/components/common/Modal.svelte';
	import TimestampCell from '$lib/components/jobs/TimestampCell.svelte';
	import { tick } from 'svelte';

	/**
	 * @type {import('fractal-components/types/api').WorkflowTemplate|undefined}
	 */
	let template = $state();

	/** @type {Modal|undefined} */
	let modal = $state();

	/** @type {string|undefined} */
	let groupName = $state();

	/** @type {number|undefined} */
	let templateId = $state();

	/**
	 * @param {number} template_id
	 */
	export async function open(template_id) {
		templateId = template_id;
		modal?.show();
	}

	export async function onOpen() {
		const response = await fetch(`/api/v2/workflow-template/${templateId}`);
		if (response.ok) {
			template = await response.json();
			if (template?.user_group_id) {
				const response2 = await fetch(`/api/auth/current-user?group_ids_names=true`);
				if (response2.ok) {
					const res = await response2.json();
					groupName =
						res.group_ids_names.find(([id]) => id === template?.user_group_id)?.[1] ?? undefined;
					if (!groupName) {
						modal?.displayErrorAlert(
							new AlertError(`User group ${template?.user_group_id} not found`)
						);
					}
				} else {
					modal?.displayErrorAlert(await getAlertErrorFromResponse(response2));
				}
			}
		} else {
			modal?.displayErrorAlert(await getAlertErrorFromResponse(response));
		}
		await tick();
		const listGroup = document.querySelector('#templateInfoModal .list-group');
		if (listGroup instanceof HTMLElement) {
			listGroup.focus();
		}
	}
</script>

<Modal
	id="templateInfoModal"
	centered={true}
	scrollable={true}
	bind:this={modal}
	size="lg"
	{onOpen}
	onClose={() => (template = undefined)}
>
	{#snippet header()}
		<h5 class="modal-title">Template '{template?.name}'</h5>
	{/snippet}
	{#snippet body()}
		<div id="errorAlert-templateInfoModal"></div>
		{#if template}
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<ul class="list-group" tabindex="0">
				<li class="list-group-item text-bg-light">
					<strong>Name</strong>
				</li>
				<li class="list-group-item">
					<span>{template?.name}</span>
				</li>
				<li class="list-group-item text-bg-light">
					<strong>Description</strong>
				</li>
				<li class="list-group-item">
					<span>{template?.description ? template.description : '-'}</span>
				</li>
				<li class="list-group-item text-bg-light">
					<strong>User email</strong>
				</li>
				<li class="list-group-item">
					<span>{template?.user_email}</span>
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
				<li class="list-group-item text-bg-light">
					<strong>Template ID</strong>
				</li>
				<li class="list-group-item">
					<span>{template?.id}</span>
				</li>
			</ul>
		{/if}
	{/snippet}
</Modal>
