<script>
	import JobsList from '$lib/components/jobs/JobsList.svelte';
	import { page } from '$app/stores';
</script>

<div class="container">
	<div class="d-flex justify-content-between align-items-center my-3">
		<h1>Jobs of user "{$page.data.userInfo.email}"</h1>
	</div>
	<JobsList />
</div>
