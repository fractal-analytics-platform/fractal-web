<script>
	import { page } from '$app/state';

	/** @type {import('fractal-components/types/api').Resource} */
	const resource = $derived(page.data.resource);
</script>

<div class="container mt-3">
	<div class="row">
		<div class="col">
			<nav aria-label="breadcrumb">
				<ol class="breadcrumb">
					<li class="breadcrumb-item">
						<a href="/v2/admin">Admin area</a>
					</li>
					<li class="breadcrumb-item">
						<a href="/v2/admin/resources">Resources</a>
					</li>
					<li class="breadcrumb-item active" aria-current="page">
						{resource.name} (#{resource.id})
					</li>
				</ol>
			</nav>

			<a href="/v2/admin/resources/{resource.id}/edit" class="btn btn-primary float-end">
				<i class="bi bi-pencil"></i>
				Edit
			</a>
		</div>
	</div>

	<pre>{JSON.stringify(resource, null, 2)}</pre>
</div>
