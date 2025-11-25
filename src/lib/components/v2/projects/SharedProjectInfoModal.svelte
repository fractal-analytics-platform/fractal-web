<script>
	import { getAlertErrorFromResponse } from '$lib/common/errors';
	import Modal from '../../common/Modal.svelte';

	/** @type {Modal|undefined}*/
	let modal = $state();

	/**
	 * @type {import('fractal-components/types/api').ProjectV2|undefined}
	 */
	let project = $state();
	let loading = $state(false);
	/**
	 * @type {import('fractal-components/types/api').LinkUserProjectV2|undefined}
	 */
	let info = $state();

	/**
	 * @param {import('fractal-components/types/api').ProjectV2} p
	 */
	export async function open(p) {
		modal?.show();

		project = p;
		loading = true;
		loading = false;

		const response = await fetch(`/api/v2/project/${project.id}/access`, {
			method: 'GET'
		});
		if (response.ok) {
			info = await response.json();
		} else {
			modal?.displayErrorAlert(await getAlertErrorFromResponse(response));
		}
	}
</script>

<Modal id="shareProjectInfoModal" size="lg" bind:this={modal}>
	{#snippet header()}
		{#if project}
			<h1 class="h5 modal-title flex-grow-1">Project {project.name}</h1>
			<a href={'/v2/projects/' + project.id} class="btn btn-light me-3">
				Open <i class="bi bi-arrow-up-right-square"></i>
			</a>
		{/if}
	{/snippet}
	{#snippet body()}
		{#if project}
			<div class="row mb-3">
				<div class="col-12">
					<p class="lead">Project properties</p>
					{#if loading}
						Loading...
					{/if}
					<div id="errorAlert-shareProjectInfoModal"></div>
					{#if info}
						<ul class="list-group">
							<li class="list-group-item list-group-item-light fw-bold">Owner e-mail</li>
							<li class="list-group-item">{info.owner_email}</li>
							<li class="list-group-item list-group-item-light fw-bold">Permissions</li>
							<li class="list-group-item">
								{info.pemissions === 'r'
									? 'Read'
									: info.pemissions === 'rw'
										? 'Read, Write'
										: 'Read, Write, Execute'}
							</li>
						</ul>
					{/if}
				</div>
			</div>
		{/if}
	{/snippet}
</Modal>
