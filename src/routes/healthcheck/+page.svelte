<script>
	import { goto } from '$app/navigation';
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte';
	import { onMount } from 'svelte';

	let inProgress = false;
	let stepMessage = '';
	let error = undefined;
	let randomProjectName = '';

	const zarrDir = '/invalid/zarr/dir/not/to/be/used/';

	onMount(() => {
		const randomPart = new Date().getTime();
		randomProjectName = `test_${randomPart}`;
	});

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

		stepMessage = `Creating project ${randomProjectName}`;

		const response = await fetch(`/api/v2/project`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				name: randomProjectName
			})
		});

		if (!response.ok) {
			throw await getAlertErrorFromResponse(response);
		}
		const result = await response.json();
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
				zarr_dir: zarrDir
			})
		});

		if (!response.ok) {
			throw await getAlertErrorFromResponse(response);
		}
		const result = await response.json();
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

		if (!response.ok) {
			throw await getAlertErrorFromResponse(response);
		}
		const result = await response.json();
		return result.id;
	}

	async function createHealthCheckTaskIfNeeded() {
		stepMessage = `Checking if health check test task exists`;
		const taskId = await getHealthCheckTask();
		if (taskId !== undefined) {
			return taskId;
		}

		stepMessage = `Creating health check test task`;

		const response = await fetch(`/api/v2/task?private=true`, {
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

		if (!response.ok) {
			throw await getAlertErrorFromResponse(response);
		}
		const result = await response.json();
		return result.id;
	}

	async function getHealthCheckTask() {
		const response = await fetch(`/api/v2/task?args_schema=false`, {
			method: 'GET',
			credentials: 'include'
		});
		if (!response.ok) {
			throw await getAlertErrorFromResponse(response);
		}
		const result = await response.json();
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
		if (!response.ok) {
			throw await getAlertErrorFromResponse(response);
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
				body: JSON.stringify({ first_task_index: 0, attribute_filters: {} })
			}
		);
		if (!response.ok) {
			throw await getAlertErrorFromResponse(response);
		}
	}
</script>

<div>
	<h1 class="fw-light mb-3">Job-submission test</h1>

	<p>
		This page lets you test that job execution works as expected, which is useful to verify that
		your user settings are configured properly.
	</p>

	<p>After you click the "Run test" button:</p>

	<ol>
		<li>A new project named <code>{randomProjectName}</code> is created.</li>
		<li>
			A new dataset (with <code>zarr_dir={zarrDir}</code>) and a new workflow (with a non-parallel
			task named <code>__TEST_ECHO_TASK__</code>) are added to the project.
		</li>
		<li>Submit the workflow for execution.</li>
	</ol>

	<p>
		If anything fails before the job starts running, you will see an error in this page. Otherwise,
		you'll be redirected to the workflow page, where you can monitor that the job completes
		successfully.
	</p>

	<p>
		Note: after running this test, you can safely delete the project
		<code>{randomProjectName}</code>.
	</p>

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
