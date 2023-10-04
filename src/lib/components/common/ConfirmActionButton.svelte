<script>
	import Modal from './Modal.svelte';

	export let callbackAction = async () => {}; // A default empty function
	export let style = 'primary';
	export let btnStyle = 'primary';
	export let label = '';
	export let buttonIcon = undefined;
	export let modalId = undefined;
	export let message = '';
	/** @type {Modal} */
	let modal;

	const onOpen = () => {
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
		modal.confirmAndHide(callbackAction)
	};
</script>

<Modal id={modalId} {onOpen} bind:this={modal}>
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
</Modal>

<button
	class="btn btn-{btnStyle}"
	data-bs-toggle="modal"
	data-bs-target="#{modalId}"
>
	{#if buttonIcon}
		<i class="bi bi-{buttonIcon}" />
	{/if}
	{label}
</button>
