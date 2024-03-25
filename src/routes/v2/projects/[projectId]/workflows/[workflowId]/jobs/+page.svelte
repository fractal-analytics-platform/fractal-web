<script>
	import JobsList from '$lib/components/v2/jobs/JobsList.svelte';
	import { page } from '$app/stores';
	import { AlertError } from '$lib/common/errors';

	/** @type {import('$lib/types').Project} */
	let project = $page.data.project;
	/** @type {import('$lib/types').Workflow} */
	let workflow = $page.data.workflow;

	/**
	 * @returns {Promise<import('$lib/types-v2').ApplyWorkflowV2[]>}
	 */
	async function jobUpdater() {
		const response = await fetch(`/api/v2/project/${project.id}/workflow/${workflow.id}/job`, {
			method: 'GET',
			credentials: 'include',
			mode: 'cors'
		});
		const result = await response.json();
		if (!response.ok) {
			throw new AlertError(result);
		}
		return result;
	}
</script>

{#if project && workflow}
	<div class="d-flex justify-content-between align-items-center">
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
		<div />
	</div>

	<JobsList columnsToHide={['project', 'workflow', 'user_email', 'id']} {jobUpdater} />
{/if}
