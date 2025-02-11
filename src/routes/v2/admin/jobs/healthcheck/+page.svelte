<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import { sortDropdownUsers } from '$lib/components/admin/user_utilities';

	let inProgress = false;
	let userId = $page.data.userInfo.id;

	$: users = sortDropdownUsers($page.data.users, $page.data.userInfo.id);

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	const zarrDir = '/invalid/zarr/dir/not/to/be/used/';

	const headers = new Headers();
	headers.set('Content-Type', 'application/json');

	async function startTest() {
		errorAlert?.hide();
		inProgress = true;

		let url;
		if ($page.data.userInfo.id == userId) {
			url = `/api/v2/healthcheck`;
		} else {
			url = `/api/admin/v2/healthcheck/${userId}`;
		}

		const response = await fetch(url, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify({
				zarr_dir: zarrDir
			})
		});
		if (response.ok) {
			const job = await response.json();
			if ($page.data.userInfo.id == userId) {
				await goto(`/v2/projects/${job.project_id}/workflows/${job.workflow_id}`);
			} else {
				await goto(`/v2/admin/jobs?job_id=${job.workflow_id}`);
			}
		} else {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'errorAlert-healthcheck'
			);
		}
		inProgress = false;
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

	<div id="errorAlert-healthcheck" />

	<div class="row row-cols-md-auto g-3 align-items-center mt-3">
		<div class="col-12">
			<div class="input-group mb-3">
				<label class="input-group-text" for="user">Run as</label>
				<select class="form-select" bind:value={userId} id="user">
					{#each users as user}
						<option value={user.id}>{user.email}</option>
					{/each}
				</select>
				<button class="btn btn-primary" disabled={inProgress} on:click={startTest}>
					{#if inProgress}
						<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
					{/if}
					Test
				</button>
			</div>
		</div>
	</div>
</div>
