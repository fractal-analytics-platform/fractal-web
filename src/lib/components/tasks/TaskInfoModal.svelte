<script>
	// TaskInfoModal component
	import { taskModal } from '$lib/stores/taskStores';

	// Task to be displayed
	// let task = {}

	// Subscription to taskModalId store to update task property with respect
	// to the task in the store. Enable app-wide updates to the project to be
	// displayed in this component.
	// taskModal.subscribe( taskId => {
	// 	project =
	// })
	$: task = $taskModal;
</script>

<div class="modal modal-xl" id="taskInfoModal">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h1 class="h5 modal-title">Task {task?.name}</h1>
				<button class="btn-close" data-bs-dismiss="modal" />
			</div>
			<div class="modal-body">
				<div class="row mb-3">
					<div class="col-12">
						<p class="lead">Task properties</p>
						<ul class="list-group">
							<li class="list-group-item list-group-item-light fw-bold">Name</li>
							<li class="list-group-item">{task?.name}</li>
							<li class="list-group-item list-group-item-light fw-bold">Version</li>
							<li class="list-group-item">{task?.version}</li>
							<li class="list-group-item list-group-item-light fw-bold">Owner</li>
							<li class="list-group-item">{task?.owner}</li>
							<li class="list-group-item list-group-item-light fw-bold">Command</li>
							<li class='list-group-item'><code>{task?.command}</code></li>
							<li class='list-group-item list-group-item-light fw-bold'>Source</li>
							<li class='list-group-item'><code>{task?.source}</code></li>
							<li class='list-group-item list-group-item-light fw-bold'>Input Type</li>
							<li class='list-group-item'>
								<pre>{task?.input_type}</pre>
							</li>
							<li class='list-group-item list-group-item-light fw-bold'>Output Type</li>
							<li class='list-group-item'>
								<pre>{task?.output_type}</pre>
							</li>
							<li class='list-group-item list-group-item-light fw-bold'>Args Schema Version</li>
							<li class='list-group-item'>{task?.args_schema_version}</li>
							<li class='list-group-item list-group-item-light fw-bold'>Args Schema</li>
							<li class='list-group-item'>
								<code>
									<pre>{JSON.stringify(task?.args_schema, null, 2)}</pre>
								</code>
							</li>
						</ul>
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			</div>
		</div>
	</div>
</div>
