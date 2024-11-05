<script>
	import { AlertError, displayStandardErrorAlert } from '$lib/common/errors';
	import { tick } from 'svelte';
	import Modal from '../../common/Modal.svelte';

	let log = '';
	let errorAlert = undefined;

	/** @type {Modal} */
	let modal;

	/**
	 * @param {number} taskCollectionId
	 */
	export async function open(taskCollectionId) {
		// remove previous error
		if (errorAlert) {
			errorAlert.hide();
		}
		log = '';

		modal.show();

		const response = await fetch(`/api/v2/task/collect/${taskCollectionId}`, {
			method: 'GET',
			credentials: 'include'
		});

		const result = await response.json();
		if (response.ok) {
			if (result.data.log) {
				log = result.data.log;
			}
		} else {
			console.error('Failed to fetch collection logs', result);
			errorAlert = displayStandardErrorAlert(
				new AlertError(result, response.status),
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
		<h1 class="h5 modal-title">Task collection logs</h1>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="collectionTaskLogsError" />
		<pre>{log}</pre>
	</svelte:fragment>
</Modal>
