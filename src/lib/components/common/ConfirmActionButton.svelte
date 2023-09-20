<script>
	import StandardErrorAlert from '$lib/components/common/StandardErrorAlert.svelte';
	import { AlertError } from '$lib/common/errors';

	export let callbackAction = async () => {}; // A default empty function
	export let style = 'primary';
	export let btnStyle = 'primary';
	export let label = '';
	export let buttonIcon = undefined;
	export let modalId = undefined;
	export let message = '';

	const openModal = () => {
		// Remove old errors
		const errorAlert = document.getElementById(`errorAlert-${modalId}`);
		if (errorAlert) {
			errorAlert.innerHTML = '';
		}
	};

	/**
	 * Executes the callback handling possible errors
	 */
	const handleCallbackAction = async () => {
		try {
			// important: retrieve the modal before executing callbackAction(), because it could remove
			// the container element and then cause issues with the hide function
			// @ts-ignore
			// eslint-disable-next-line no-undef
			const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
			await callbackAction();
			modal.hide();
		} catch (/** @type {any} */ error) {
			const errorAlert = document.getElementById(`errorAlert-${modalId}`);
			if (errorAlert) {
				new StandardErrorAlert({
					target: errorAlert,
					props: {
						error
					}
				});
			}
		}
	};
</script>

<div class="modal modal-lg" id={modalId}>
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h1 class="modal-title fs-5">Confirm action</h1>
				<button class="btn-close" data-bs-dismiss="modal" />
			</div>
			<div class="modal-body">
				<p>You're about to:</p>
				<p class="badge bg-{style} fs-6">{message}</p>
				<p>Do you confirm?</p>
			</div>
			<div class="modal-footer">
				<div class="container">
					<div id="errorAlert-{modalId}" />
				</div>
				<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
				<button class="btn btn-primary" on:click={handleCallbackAction}>Confirm</button>
			</div>
		</div>
	</div>
</div>

<button
	class="btn btn-{btnStyle}"
	data-bs-toggle="modal"
	data-bs-target="#{modalId}"
	on:click={openModal}
>
	{#if buttonIcon}
		<i class="bi bi-{buttonIcon}" />
	{/if}
	{label}
</button>
