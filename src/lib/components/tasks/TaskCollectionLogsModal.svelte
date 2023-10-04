<script>
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import { modalTaskCollectionId } from '$lib/stores/taskStores';
	import Modal from '../common/Modal.svelte';

	let logs = '';
	let errorAlert = undefined;

	modalTaskCollectionId.subscribe(async (taskCollectionId) => {
		if (taskCollectionId !== undefined) {
			// remove previous error
			if (errorAlert) {
				errorAlert.hide();
			}
			logs = '';

			const response = await fetch(`/api/v1/task/collect/${taskCollectionId}?verbose=True`, {
				method: 'GET',
				credentials: 'include'
			});

			const result = await response.json();
			if (response.ok) {
				logs = result.data.log;
			} else {
				console.error('Failed to fetch collection logs', result);
				errorAlert = displayStandardErrorAlert(result, 'collectionTaskLogsError');
			}
		}
	});
</script>

<Modal id="collectionTaskLogsModal" fullscreen={true}>
	<div class="modal-header">
		<h1 class="h5 modal-title">Task collection logs</h1>
		<button class="btn-close" data-bs-dismiss="modal" />
	</div>
	<div class="modal-body bg-tertiary text-secondary">
		<div id="collectionTaskLogsError" />
		<pre>{logs}</pre>
	</div>
</Modal>
