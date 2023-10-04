<script>
	import { formatMarkdown } from '$lib/common/component_utilities';

	// TaskInfoModal component
	import { taskStore } from '$lib/stores/taskStores';
	import Modal from '../common/Modal.svelte';

	// Task to be displayed
	// let task = {}

	// Subscription to taskModalId store to update task property with respect
	// to the task in the store. Enable app-wide updates to the project to be
	// displayed in this component.
	// taskModal.subscribe( taskId => {
	// 	project =
	// })
	$: task = $taskStore;
</script>

<Modal id="taskInfoModal" size="xl">
	{#if task}
		<div class="modal-header">
			<h1 class="h5 modal-title">Task {task.name}</h1>
			<button class="btn-close" data-bs-dismiss="modal" />
		</div>
		<div class="modal-body">
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
							{#if task.args_schema}
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
		</div>
		<div class="modal-footer">
			<button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
		</div>
	{/if}
</Modal>
