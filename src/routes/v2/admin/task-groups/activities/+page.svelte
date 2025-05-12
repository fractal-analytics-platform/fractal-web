<script>
	import { page } from '$app/state';
	import TaskGroupActivities from '$lib/components/v2/tasks/TaskGroupActivities.svelte';

	const users = $derived(page.data.users || []);
</script>

<div class="container mt-3">
	<TaskGroupActivities admin={true} {users} />
</div>
