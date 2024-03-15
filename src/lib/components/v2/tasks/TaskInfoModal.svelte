<script>
	import { formatMarkdown } from '$lib/common/component_utilities';
	import Modal from '../../common/Modal.svelte';

	/** @type {import('$lib/types').Task|undefined} */
	let task;

	/** @type {Modal} */
	let modal;
	let loading = false;

	/**
	 *
	 * @param {import('$lib/types').Task} taskToLoad
	 */
	export async function open(taskToLoad) {
		modal.show();
		task = taskToLoad;

		// Retrieving the args_schema field
		loading = true;
		const response = await fetch(`/api/v2/task/${taskToLoad.id}`, {
			method: 'GET',
			credentials: 'include'
		});

		const result = await response.json();

		if (response.ok) {
			task = result;
		} else {
			modal.displayErrorAlert('Unable to load task');
			task = undefined;
		}
		loading = false;
	}
</script>

<Modal id="taskInfoModal" size="xl" bind:this={modal}>
	<svelte:fragment slot="header">
		{#if task}
			<h1 class="h5 modal-title">Task {task.name}</h1>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="body">
		<span id="errorAlert-taskInfoModal" />
		{#if task}
			<div class="row mb-3">
				<div class="col-12">
					<p class="lead">Task properties</p>
					<ul class="list-group">
						<li class="list-group-item list-group-item-light fw-bold">Name</li>
						<li class="list-group-item">{task.name}</li>
						<li class="list-group-item list-group-item-light fw-bold">Version</li>
						<li class="list-group-item">{task.version || '-'}</li>
						<li class="list-group-item list-group-item-light fw-bold">Owner</li>
						<li class="list-group-item">{task.owner || '-'}</li>
						<li class="list-group-item list-group-item-light fw-bold">Command</li>
						<li class="list-group-item"><code>{task.command}</code></li>
						<li class="list-group-item list-group-item-light fw-bold">Source</li>
						<li class="list-group-item"><code>{task.source}</code></li>
						<li class="list-group-item list-group-item-light fw-bold">Input Type</li>
						<li class="list-group-item">
							<code>{task.input_type}</code>
						</li>
						<li class="list-group-item list-group-item-light fw-bold">Output Type</li>
						<li class="list-group-item">
							<code>{task.output_type}</code>
						</li>
						<li class="list-group-item list-group-item-light fw-bold">Args Schema Version</li>
						<li class="list-group-item">{task.args_schema_version || '-'}</li>
						<li class="list-group-item list-group-item-light fw-bold">Args Schema</li>
						<li class="list-group-item">
							{#if loading}
								<div class="spinner-border spinner-border-sm" role="status">
									<span class="visually-hidden">Loading...</span>
								</div>
							{:else if task.args_schema}
								<code>
									<pre>{JSON.stringify(task.args_schema, null, 2)}</pre>
								</code>
							{:else}
								-
							{/if}
						</li>
						<li class="list-group-item list-group-item-light fw-bold">Docs Link</li>
						<li class="list-group-item">
							{#if task.docs_link}
								<a href={task.docs_link} target="_blank">{task?.docs_link}</a>
							{:else}
								-
							{/if}
						</li>
						<li class="list-group-item list-group-item-light fw-bold">Docs Info</li>
						<li class="list-group-item">
							{#if task.docs_info}
								{@html formatMarkdown(task.docs_info)}
							{:else}
								-
							{/if}
						</li>
					</ul>
				</div>
			</div>
		{/if}
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
	</svelte:fragment>
</Modal>
