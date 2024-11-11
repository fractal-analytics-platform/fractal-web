<script>
	import { page } from '$app/stores';
	import TaskGroupActivities from '$lib/components/v2/tasks/TaskGroupActivities.svelte';
</script>

<TaskGroupActivities admin={true} users={$page.data.users} />
