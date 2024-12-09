<script>
	import tasks from '../tasks.json';
	import FilteredTasksTable from 'fractal-components/tasks/FilteredTasksTable.svelte';
</script>

<div class="container mt-3">
	<FilteredTasksTable taskGroups={tasks} />
</div>
