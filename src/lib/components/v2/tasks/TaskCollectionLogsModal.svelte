<script>
	import { AlertError, displayStandardErrorAlert } from '$lib/common/errors';
	import { modalTaskCollectionId } from '$lib/stores/taskStores';
	import { onDestroy } from 'svelte';
	import Modal from '../../common/Modal.svelte';

	let logs = '';
	let errorAlert = undefined;

	const unsubscribe = modalTaskCollectionId.subscribe(async (taskCollectionId) => {
		if (taskCollectionId !== undefined) {
			// remove previous error
			if (errorAlert) {
				errorAlert.hide();
			}
			logs = '';

			const response = await fetch(`/api/v2/task/collect/${taskCollectionId}`, {
				method: 'GET',
				credentials: 'include'
			});

			const result = await response.json();
			if (response.ok) {
				logs = result.data.log;
			} else {
				console.error('Failed to fetch collection logs', result);
				errorAlert = displayStandardErrorAlert(
					new AlertError(result, response.status),
					'collectionTaskLogsError'
				);
			}
		}
	});

	onDestroy(unsubscribe);
</script>

<Modal id="collectionTaskLogsModal" fullscreen={true} bodyCss="bg-tertiary text-secondary">
	<svelte:fragment slot="header">
		<h1 class="h5 modal-title">Task collection logs</h1>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<div id="collectionTaskLogsError" />
		<pre>{logs}</pre>
	</svelte:fragment>
</Modal>
