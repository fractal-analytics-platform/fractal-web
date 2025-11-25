<script>
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';

	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').ProjectInvitation} invitation
	 * @property {() => Promise<void>} onAccept
	 */

	/** @type {Props} */
	let { invitation, onAccept } = $props();

	let display = $state(true);

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	async function acceptInvitation() {
		errorAlert?.hide();
		const response = await fetch(`/api/v2/project/${invitation.project_id}/access/accept`, {
			method: 'POST'
		});
		if (response.ok) {
			display = false;
			await onAccept();
		} else {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				`errorAlert-invitation-${invitation.project_id}`
			);
		}
	}

	async function rejectInvitation() {
		errorAlert?.hide();
		const response = await fetch(`/api/v2/project/${invitation.project_id}/access`, {
			method: 'DELETE'
		});
		if (response.ok) {
			display = false;
		} else {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				`errorAlert-invitation-${invitation.project_id}`
			);
		}
	}
</script>

{#if display}
	<div class="alert alert-info pb-0">
		<div class="mb-3">
			User {invitation.owner_email} wants to share project "{invitation.project_name}" with you.
			<button type="button" class="btn btn-success ms-4 me-2" onclick={acceptInvitation}>
				Accept
			</button>
			<button type="button" class="btn btn-danger" onclick={rejectInvitation}>Reject</button>
		</div>
		<div id="errorAlert-invitation-{invitation.project_id}"></div>
	</div>
{/if}
