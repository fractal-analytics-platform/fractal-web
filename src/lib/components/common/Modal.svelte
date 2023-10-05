<script>
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import { onMount } from 'svelte';

	export let id;
	export let onOpen = () => {};
	export let onClose = () => {};
	/** @type {'sm'|'md'|'lg'|'xl'|undefined} */
	export let size = undefined;
	export let fullscreen = false;
	export let centered = false;
	export let scrollable = false;
	export let bodyCss = '';
	let errorAlert;

	onMount(async () => {
		const modal = document.getElementById(id);
		if (modal) {
			modal.addEventListener('show.bs.modal', () => {
				hideErrorAlert();
				onOpen();
			});
			modal.addEventListener('shown.bs.modal', () => {
				// Automatically set focus on first input element (if any)
				const firstInput = document.querySelector(`#${id} input`);
				if (firstInput instanceof HTMLElement) {
					firstInput.focus();
				}
			});
			modal.addEventListener('hidden.bs.modal', onClose);
		}
	});

	export function show() {
		getBootstrapModal().show();
	}

	export function hide() {
		getBootstrapModal().hide();
	}

	export function toggle() {
		getBootstrapModal().toggle();
	}

	/**
	 * Executes a callback function when the user confirm the modal action. If the callback is successful
	 * the modal is closed, otherwise an error message is displayed.
	 * @param {() => Promise<void>} confirm The asynchronous function to be executed before closing the modal
	 */
	export async function confirmAndHide(confirm) {
		// important: retrieve the modal before executing confirm(), because it could remove
		// the container element and then cause issues with the hide function
		const modal = getBootstrapModal();
		try {
			hideErrorAlert();
			await confirm();
			modal.hide();
		} catch (/** @type {any} */ error) {
			errorAlert = displayStandardErrorAlert(error, `errorAlert-${id}`);
		}
	}

	export function hideErrorAlert() {
		if (errorAlert) {
			errorAlert.hide();
		}
	}

	export function displayErrorAlert(/** @type {any} */ error) {
		errorAlert = displayStandardErrorAlert(error, `errorAlert-${id}`);
	}

	function getBootstrapModal() {
		const modalElement = document.getElementById(id);
		// @ts-ignore
		// eslint-disable-next-line no-undef
		const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
		if (bootstrapModal) {
			return bootstrapModal;
		}
		// @ts-ignore
		// eslint-disable-next-line no-undef
		return new bootstrap.Modal(modalElement);
	}
</script>

<!-- Note: tabindex="-1" is needed to fix escape key not working in some cases -->
<!-- (see https://stackoverflow.com/a/12630531) -->
<div class="modal {size ? 'modal-' + size : ''}" {id} tabindex="-1">
	<div
		class="modal-dialog"
		class:modal-fullscreen={fullscreen}
		class:modal-dialog-centered={centered}
		class:modal-dialog-scrollable={scrollable}
	>
		<div class="modal-content">
			<div class="modal-header">
				<slot name="header" />
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" />
			</div>
			<div class="modal-body {bodyCss}">
				<slot name="body" />
			</div>
			{#if !!$$slots.footer}
			<div class="modal-footer">
				<slot name="footer" />
			</div>
			{/if}
		</div>
	</div>
</div>
