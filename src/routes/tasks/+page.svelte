<script>
	import { enhance } from '$app/forms'
	import { taskModal } from '$lib/stores/taskStores'
	import TaskInfoModal from '$lib/components/tasks/TaskInfoModal.svelte'
	export let data
	export let form


	// Error property to be set in order to show errors in UI
	let errorReasons = ''
	// Tasks property updated with respect to data store
	$: tasks = data.tasks

	function actionResult(result) {
		if (result) {
			if (result.createAction && !result.createAction.success) {
				// errorReasons = JSON.stringify(result.createAction.reason, undefined, 2)
				setErrorReasons(result.createAction.reason)
			}
		}

		if (result && result.createAction && result.createAction.success) {
			// Success logic
		}
	}

	function setErrorReasons(value) {
		errorReasons = JSON.stringify(value, undefined, 2)
	}

	function setTaskModal(event) {
		const taskId = event.currentTarget.getAttribute('data-fc-task')
		const task = tasks.find(t => t.id == taskId)
		taskModal.set(task)
	}

	$: actionResult(form)
</script>

<h1>Tasks page</h1>

<TaskInfoModal></TaskInfoModal>

<div class='container mt-4'>
	<div class='row'>
		<form method="post" action="?/create" class="" use:enhance>
			<div class="row g-3">
				<div class="col-6">
					<div class="input-group">
						<div class="input-group-text">Task name</div>
						<input name="name" type="text" class="form-control">
					</div>
				</div>
				<div class="col-12">
					<div class="input-group">
						<div class="input-group-text">Command</div>
						<input name="command" type="text" class="form-control">
					</div>
				</div>
				<div class="col-6">
					<div class="input-group">
						<div class="input-group-text">Source</div>
						<input name="source" type="text" class="form-control">
					</div>
				</div>
				<div class="row">

				</div>
				<div class="col-6">
					<div class="input-group">
						<div class="input-group-text">Input type</div>
						<input name="input_type" type="text" class="form-control">
					</div>
				</div>
				<div class="col-6">
					<div class="input-group">
						<div class="input-group-text">Output type</div>
						<input name="output_type" type="text" class="form-control">
					</div>
				</div>
				<div class="col-auto">
					<button type="submit" class="btn btn-primary">Create</button>
				</div>
			</div>
		</form>
		{#if errorReasons != '' }
			<div class="col-12 p-2">
				<div class="alert alert-danger">
					<pre>There has been an error, reason:</pre>
					<pre>{errorReasons}</pre>
				</div>
			</div>
		{/if}
	</div>
	<div class='row mt-4'>
		<div class='col-12'>
			<table class='table'>
				<thead class='table-light'>
					<tr>
						<th>Name</th>
						<th>Source</th>
						<th>Options</th>
					</tr>
				</thead>
				<tbody>
					{#each tasks as task}
						<tr>
							<td>{task.name}</td>
							<td><code>{task.source}</code></td>
							<td>
								<button data-fc-task='{task.id}' class='btn btn-light' data-bs-toggle="modal" data-bs-target="#taskInfoModal" on:click={setTaskModal}>
									<i class="bi bi-info-circle"></i>
								</button>
								<button class='btn btn-danger' disabled>
									Delete
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>