<script>
	import { enhance } from '$app/forms'
	export let data
	export let form


	// Error property to be set in order to show errors in UI
	let errorReasons = ''

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

	$: actionResult(form)
</script>
<h1>Tasks page</h1>
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
		<div class="col-12">
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
	<div class="row p-4">
		<div class="alert alert-danger">
			<pre>There has been an error, reason:</pre>
			<pre>{errorReasons}</pre>
		</div>
	</div>
{/if}
{#each data.tasks as task}
	<p>{task.name}</p>
{/each}