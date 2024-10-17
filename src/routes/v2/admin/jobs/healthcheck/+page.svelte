<script>
	import { goto } from '$app/navigation';
	import { AlertError } from '$lib/common/errors';
	import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte';

	let inProgress = false;
	let stepMessage = '';
	let error = undefined;
	
	const zarrDir = '/invalid/zarr/dir/not/to/be/used/';

	async function startTest() {
		error = undefined;
		stepMessage = '';
		inProgress = true;
		try {
			const projectId = await createProject();
			const datasetId = await createDataset(projectId);
			const workflowId = await createWorkflow(projectId);
			const taskId = await createHealthCheckTaskIfNeeded();
			await addTaskToWorkflow(projectId, workflowId, taskId);
			await submitWorkflow(projectId, workflowId, datasetId);
			await goto(`/v2/projects/${projectId}/workflows/${workflowId}`);
		} catch (err) {
			error = err;
		} finally {
			inProgress = false;
		}
	}

	const headers = new Headers();
	headers.set('Content-Type', 'application/json');

	async function createProject() {
		const randomPart = new Date().getTime();
		const projectName = `test_${randomPart}`;

		stepMessage = `Creating project ${projectName}`;

		const response = await fetch(`/api/v2/project`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				name: projectName
			})
		});

		const result = await response.json();
		if (!response.ok) {
			throw new AlertError(result);
		}
		return result.id;
	}

	/**
	 * @param {number} projectId
	 */
	async function createDataset(projectId) {
		stepMessage = `Creating test dataset`;

		const response = await fetch(`/api/v2/project/${projectId}/dataset`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				name: 'test',
				zarr_dir: zarrDir,
				filters: { attributes: {}, types: {} }
			})
		});

		const result = await response.json();
		if (!response.ok) {
			throw new AlertError(result);
		}
		return result.id;
	}

	/**
	 * @param {number} projectId
	 */
	async function createWorkflow(projectId) {
		stepMessage = `Creating test workflow`;

		const response = await fetch(`/api/v2/project/${projectId}/workflow`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify({ name: 'test' })
		});

		const result = await response.json();
		if (!response.ok) {
			throw new AlertError(result);
		}
		return result.id;
	}

	async function createHealthCheckTaskIfNeeded() {
		stepMessage = `Checking if health check test task exists`;
		const taskId = await getHealthCheckTask();
		if (taskId !== undefined) {
			return taskId;
		}

		stepMessage = `Creating health check test task`;

		const response = await fetch(`/api/v2/task`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				name: '__TEST_ECHO_TASK__',
				command_non_parallel: 'echo',
				version: '9.9.9',
				input_types: {},
				output_types: {}
			})
		});

		const result = await response.json();
		if (!response.ok) {
			throw new AlertError(result);
		}
		return result.id;
	}

	async function getHealthCheckTask() {
		const response = await fetch(`/api/v2/task`, {
			method: 'GET',
			credentials: 'include'
		});
		const result = await response.json();
		if (!response.ok) {
			throw new AlertError(result);
		}
		const tasks = result.filter((t) => t.name === '__TEST_ECHO_TASK__');
		return tasks.length > 0 ? tasks[0].id : undefined;
	}

	/**
	 * @param {number} projectId
	 * @param {number}  workflowId
	 * @param {number}  taskId
	 */
	async function addTaskToWorkflow(projectId, workflowId, taskId) {
		stepMessage = `Adding task to workflow`;

		const response = await fetch(
			`/api/v2/project/${projectId}/workflow/${workflowId}/wftask?task_id=${taskId}`,
			{
				method: 'POST',
				credentials: 'include',
				headers,
				body: JSON.stringify({})
			}
		);
		const result = await response.json();
		if (!response.ok) {
			throw new AlertError(result);
		}
	}

	/**
	 * @param {number} projectId
	 * @param {number} workflowId
	 * @param {number} datasetId
	 */
	async function submitWorkflow(projectId, workflowId, datasetId) {
		stepMessage = `Submitting workflow`;

		const response = await fetch(
			`/api/v2/project/${projectId}/job/submit?workflow_id=${workflowId}&dataset_id=${datasetId}`,
			{
				method: 'POST',
				credentials: 'include',
				headers,
				body: JSON.stringify({ first_task_index: 0 })
			}
		);
		const result = await response.json();
		if (!response.ok) {
			throw new AlertError(result);
		}
	}
</script>

<div>
	<h1 class="fw-light mb-3">Job submission healthcheck</h1>

	<p>This page performs the following steps:</p>

	<ul>
		<li>creates a project with name <code>test_&#123;random_integer&#125;</code>;</li>
		<li>creates a dataset with <code>zarr_dir={zarrDir}</code></li>
		<li>creates a workflow;</li>
		<li>
			if not existing, creates a non-parallel task with <code>name=__TEST_ECHO_TASK__</code>,
			<code>version=9.9.9</code> and <code>command_non_parallel="echo"</code>.
		</li>
		<li>adds the task to the workflow;</li>
		<li>submits the workflow;</li>
		<li>
			if all up to here was successful, redirects to the workflow page; if anything failed, stops
			the procedure and displays an error.
		</li>
	</ul>

	<StandardErrorAlert {error}>
		<p>An error happened while executing the following step: <strong>{stepMessage}</strong></p>
	</StandardErrorAlert>

	<div class="row">
		<div class="col">
			<button class="btn btn-primary" disabled={inProgress} on:click={startTest}>
				{#if inProgress}
					<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
				{/if}
				Test
			</button>
		</div>
	</div>
</div>
