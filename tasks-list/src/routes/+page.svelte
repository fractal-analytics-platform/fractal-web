<script>
	import tasks from '../tasks.json';
	import FilteredTasksTable from 'fractal-components/tasks/FilteredTasksTable.svelte';
</script>

<FilteredTasksTable taskGroups={tasks} />
