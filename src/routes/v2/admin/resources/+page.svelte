<script>
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import ConfirmActionButton from '$lib/components/common/ConfirmActionButton.svelte';
	import { onMount } from 'svelte';

	let searching = $state(false);
	/** @type {Array<import('fractal-components/types/api').Resource>} */
	let resources = $state([]);
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let searchErrorAlert;

	async function loadResources() {
		try {
			searching = true;
			searchErrorAlert?.hide();
			const url = new URL('/api/admin/v2/resource', window.location.origin);
			const response = await fetch(url);
			if (!response.ok) {
				searchErrorAlert = displayStandardErrorAlert(
					await getAlertErrorFromResponse(response),
					'searchError'
				);
				return;
			}
			resources = await response.json();
		} finally {
			searching = false;
		}
	}

	/**
	 * @param {number} id
	 */
	async function handleDeleteResource(id) {
		const response = await fetch(`/api/admin/v2/resource/${id}`, {
			method: 'DELETE'
		});

		if (response.ok) {
			resources = resources.filter((r) => r.id !== id);
		} else {
			throw await getAlertErrorFromResponse(response);
		}
	}

	onMount(async () => {
		await loadResources();
	});
</script>

<div class="container mt-3">
	<a href="/v2/admin/resources/create" class="btn btn-primary float-end">
		<i class="bi bi-plus-circle"></i>
		New resource
	</a>

	<div class="d-flex justify-content-between align-items-center mb-3">
		<h1 class="fw-light">Resources</h1>
	</div>

	<div class="row">
		<table class="table">
			<thead>
				<tr>
					<th>Id</th>
					<th>Name</th>
					<th>Type</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each resources as resource}
					<tr>
						<td>{resource.id}</td>
						<td>{resource.name}</td>
						<td>{resource.type}</td>
						<td>
							<a href="/v2/admin/resources/{resource.id}" class="btn btn-light">
								<i class="bi-info-circle"></i> Info
							</a>
							<a href="/v2/admin/resources/{resource.id}/profiles" class="btn btn-info">
								<i class="bi bi-sliders"></i> Profiles
							</a>
							<a href="/v2/admin/resources/{resource.id}/edit" class="btn btn-primary">
								<i class="bi bi-pencil"></i> Edit
							</a>
							<ConfirmActionButton
								modalId={'confirmDeleteResource' + resource.id}
								style="danger"
								btnStyle="danger"
								message="Delete resource {resource.name}"
								buttonIcon="trash"
								label="Delete"
								callbackAction={() => handleDeleteResource(resource.id)}
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<div id="searchError" class="mt-3"></div>
	</div>
</div>
