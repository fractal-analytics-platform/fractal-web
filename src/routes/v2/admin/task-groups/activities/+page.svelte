<script>
	import { page } from '$app/state';
	import AdminTaskGroupActivities from '$lib/components/v2/tasks/AdminTaskGroupActivities.svelte';

	const users = $derived(page.data.users || []);
</script>

<div class="container mt-3">
	<AdminTaskGroupActivities {users} />
</div>
