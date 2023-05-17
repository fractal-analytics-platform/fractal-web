<script>
	import { afterUpdate } from 'svelte';
	import { page } from '$app/stores';

	export let workflowJobId = undefined;
	let logs = '';

	afterUpdate(() => {
		if (workflowJobId) {
			fetchJob()
				.then((job) => {
					logs = job.log;
				})
				.catch((error) => {
					console.log(error);
				});
		}
	});

	async function fetchJob() {
		const request = await fetch(`/projects/${$page.params.projectId}/jobs/${workflowJobId}`, {
			method: 'GET',
			credentials: 'include'
		});

		if (request.status === 200) {
			return await request.json();
		} else {
			throw new Error('Failed to fetch job');
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
				<pre>{logs}</pre>
			</div>
		</div>
	</div>
</div>
