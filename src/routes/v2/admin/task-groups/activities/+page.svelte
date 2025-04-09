<script>
	import { page } from '$app/stores';
	import TaskGroupActivities from '$lib/components/v2/tasks/TaskGroupActivities.svelte';
</script>

<div class="container mt-3">
	<TaskGroupActivities admin={true} users={$page.data.users} />
</div>
