<script>
	import { page } from '$app/state';
</script>

<div class="container mt-3">
	<h1>{page.status}</h1>
	{page.error?.message}
</div>
