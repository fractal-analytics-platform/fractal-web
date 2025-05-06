<script>
	import Modal from './Modal.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {any} [callbackAction] - A default empty function
	 * @property {string} [style]
	 * @property {string} [btnStyle]
	 * @property {string} [label]
	 * @property {string|undefined} [ariaLabel]
	 * @property {any} [buttonIcon]
	 * @property {any} [modalId]
	 * @property {string} [message]
	 * @property {boolean} [disabled]
	 * @property {import('svelte').Snippet} [body]
	 */

	/** @type {Props} */
	let {
		callbackAction = async () => {},
		style = 'primary',
		btnStyle = 'primary',
		label = '',
		ariaLabel = undefined,
		buttonIcon = undefined,
		modalId = undefined,
		message = '',
		disabled = false,
		body
	} = $props();
	/** @type {Modal|undefined} */
	let modal = $state();
	let loading = $state(false);

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
		loading = true;
		modal?.confirmAndHide(callbackAction, function () {
			loading = false;
		});
	};

	const body_render = $derived(body);
</script>

<Modal id={modalId} {onOpen} bind:this={modal} size="lg">
	{#snippet header()}
		<h1 class="modal-title fs-5">Confirm action</h1>
	{/snippet}
	{#snippet body()}
		{#if !!body}
			{@render body_render?.()}
		{:else}
			<p>You're about to:</p>
			<p class="badge bg-{style} fs-6 wrap">{message}</p>
			<p>Do you confirm?</p>
		{/if}
		<div id="errorAlert-{modalId}"></div>
	{/snippet}
	{#snippet footer()}
		<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
		<button class="btn btn-primary" onclick={handleCallbackAction}>
			{#if loading}
				<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
			{/if}
			Confirm
		</button>
	{/snippet}
</Modal>

<button
	class="btn btn-{btnStyle}"
	data-bs-toggle="modal"
	data-bs-target="#{modalId}"
	aria-label={ariaLabel}
	{disabled}
>
	{#if buttonIcon}
		<i class="bi bi-{buttonIcon}"></i>
	{/if}
	{label}
</button>

<style>
	.wrap {
		white-space: normal;
	}
</style>
