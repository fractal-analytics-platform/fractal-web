<script>
	import { page } from '$app/stores';
	import { displayStandardErrorAlert } from '$lib/common/errors';

	let workflowJobId = undefined;
	let logs = '';
	let errorAlert = undefined;

	export async function show(jobId) {
		workflowJobId = jobId;

		// remove previous error
		if (errorAlert) {
			errorAlert.hide();
		}

		const job = await fetchJob();
		logs = job?.log || '';

		// @ts-ignore
		// eslint-disable-next-line
		const modal = new bootstrap.Modal(document.getElementById('workflowJobLogsModal'), {});
		modal.show();
	}

	async function fetchJob() {
		const request = await fetch(`/api/v1/project/${$page.params.projectId}/job/${workflowJobId}`, {
			method: 'GET',
			credentials: 'include'
		});

		const result = await request.json();
		if (request.ok) {
			return result;
		} else {
			console.error('Failed to fetch job', result);
			errorAlert = displayStandardErrorAlert(result, 'workflowJobLogsError');
		}
	}
</script>

<div class="modal" id="workflowJobLogsModal">
	<div class="modal-dialog modal-fullscreen">
		<div class="modal-content">
			<div class="modal-header">
				<h1 class="h5 modal-title">Workflow Job logs</h1>
				<button class="btn-close" data-bs-dismiss="modal" />
			</div>
			<div class="modal-body bg-tertiary text-secondary">
				<div id="workflowJobLogsError" />
				<pre>{logs}</pre>
			</div>
		</div>
	</div>
</div>
