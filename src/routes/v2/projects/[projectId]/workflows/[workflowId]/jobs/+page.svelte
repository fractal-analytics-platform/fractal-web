<script>
	import JobsList from '$lib/components/v2/jobs/JobsList.svelte';
	import { page } from '$app/state';
	import { getAlertErrorFromResponse } from '$lib/common/errors';

	/** @type {import('fractal-components/types/api').ProjectV2} */
	const project = $derived(page.data.project);
	/** @type {import('fractal-components/types/api').WorkflowV2} */
	const workflow = $derived(page.data.workflow);

	/**
	 * @returns {Promise<import('fractal-components/types/api').ApplyWorkflowV2[]>}
	 */
	async function jobUpdater() {
		const response = await fetch(`/api/v2/project/${project.id}/workflow/${workflow.id}/job`, {
			method: 'GET',
			credentials: 'include',
			mode: 'cors'
		});
		if (!response.ok) {
			throw await getAlertErrorFromResponse(response);
		}
		return await response.json();
	}
</script>

{#if project && workflow}
	<div class="container mt-3 d-flex justify-content-between align-items-center">
		<nav aria-label="breadcrumb">
			<ol class="breadcrumb">
				<li class="breadcrumb-item" aria-current="page">
					<a href="/v2/projects">Projects</a>
				</li>
				<li class="breadcrumb-item" aria-current="page">
					<a href="/v2/projects/{project.id}">{project.name}</a>
				</li>
				<li class="breadcrumb-item">Workflows</li>
				<li class="breadcrumb-item" aria-current="page">
					<a href="/v2/projects/{project.id}/workflows/{workflow.id}">{workflow.name}</a>
				</li>
				<li class="breadcrumb-item active" aria-current="page">Jobs</li>
			</ol>
		</nav>
		<div></div>
	</div>

	<div class="container">
		<JobsList columnsToHide={['project', 'workflow', 'user_email', 'id']} {jobUpdater} />
	</div>
{/if}
