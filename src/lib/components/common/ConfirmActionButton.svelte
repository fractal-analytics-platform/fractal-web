<script>
	import Modal from './Modal.svelte';

	export let callbackAction = async () => {}; // A default empty function
	export let style = 'primary';
	export let btnStyle = 'primary';
	export let label = '';
	/** @type {string|undefined} */
	export let ariaLabel = undefined;
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
		modal.confirmAndHide(callbackAction);
	};
</script>

<Modal id={modalId} {onOpen} bind:this={modal} size="lg">
	<svelte:fragment slot="header">
		<h1 class="modal-title fs-5">Confirm action</h1>
	</svelte:fragment>
	<svelte:fragment slot="body">
		<p>You're about to:</p>
		<p class="badge bg-{style} fs-6">{message}</p>
		<p>Do you confirm?</p>
		<div class="container">
			<div id="errorAlert-{modalId}" />
		</div>
	</svelte:fragment>
	<svelte:fragment slot="footer">
		<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		<button class="btn btn-primary" on:click={handleCallbackAction}>Confirm</button>
	</svelte:fragment>
</Modal>

<button class="btn btn-{btnStyle}" data-bs-toggle="modal" data-bs-target="#{modalId}" aria-label={ariaLabel}>
	{#if buttonIcon}
		<i class="bi bi-{buttonIcon}" />
	{/if}
	{label}
</button>
