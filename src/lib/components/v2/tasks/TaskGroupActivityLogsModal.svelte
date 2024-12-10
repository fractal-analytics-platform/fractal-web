<script>
	import {
		AlertError,
		displayStandardErrorAlert,
		getAlertErrorFromResponse
	} from '$lib/common/errors';
	import { tick } from 'svelte';
	import Modal from '../../common/Modal.svelte';

	export let admin;

	let log = '';
	let errorAlert = undefined;

	/** @type {Modal} */
	let modal;

	/**
	 * @param {number} taskGroupActivityId
	 */
	export async function open(taskGroupActivityId) {
		// remove previous error
		if (errorAlert) {
			errorAlert.hide();
		}
		log = '';

		modal.show();

		const response = await fetch(
			admin
				? `/api/admin/v2/task-group/activity?task_group_activity_id=${taskGroupActivityId}`
				: `/api/v2/task-group/activity?task_group_activity_id=${taskGroupActivityId}`,
			{
				method: 'GET',
				credentials: 'include'
			}
		);

		if (response.ok) {
			/** @type {import('fractal-components/types/api').TaskGroupActivityV2[]} */
			const activities = await response.json();
			if (activities.length === 0) {
				errorAlert = displayStandardErrorAlert(
					new AlertError('Task-group activity not found'),
					'collectionTaskLogsError'
				);
			} else if (activities[0].log) {
				log = activities[0].log;
			}
		} else {
			console.error('Failed to fetch collection logs');
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'collectionTaskLogsError'
			);
		}
	}

	/**
	 * @param {string} updatedLog
	 */
	export async function updateLog(updatedLog) {
		log = updatedLog;
		await tick();
		const modalBody = document.querySelector('#collectionTaskLogsModal .modal-body');
		if (modalBody) {
			// scroll to bottom
			modalBody.scrollTop = modalBody.scrollHeight;
		}
	}
</script>

<Modal
	id="collectionTaskLogsModal"
	fullscreen={true}
	bind:this={modal}
	bodyCss="bg-tertiary text-secondary"
>
	<svelte:fragment slot="header">
		<h1 class="h5 modal-title">Task-group activity logs</h1>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="collectionTaskLogsError" />
		<pre>{log}</pre>
	</svelte:fragment>
</Modal>
