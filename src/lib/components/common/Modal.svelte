<script>
	import { displayStandardErrorAlert } from '$lib/common/errors';
	import { onMount, tick } from 'svelte';

	
	// Set to false to avoid issues in modals containing slim-select dropdowns
	
	
	/**
	 * @typedef {Object} Props
	 * @property {any} id
	 * @property {any} [onOpen]
	 * @property {any} [onClose]
	 * @property {'sm'|'md'|'lg'|'xl'|undefined} [size]
	 * @property {boolean} [fullscreen]
	 * @property {boolean} [centered]
	 * @property {boolean} [scrollable]
	 * @property {string} [bodyCss]
	 * @property {boolean} [focus] - As a side effect, it prevents closing the modal with the esc key, unless the user has clicked inside the modal before
	 * @property {boolean} [inputAutofocus] - Automatically set the focus on the first input element inside the modal when the modal is shown
	 * @property {import('svelte').Snippet} [header]
	 * @property {import('svelte').Snippet} [body]
	 * @property {import('svelte').Snippet} [footer]
	 */

	/** @type {Props} */
	let {
		id,
		onOpen = () => {},
		onClose = () => {},
		size = undefined,
		fullscreen = false,
		centered = false,
		scrollable = false,
		bodyCss = '',
		focus = true,
		inputAutofocus = true,
		header,
		body,
		footer
	} = $props();
	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert;

	onMount(async () => {
		const modal = document.getElementById(id);
		if (modal) {
			modal.addEventListener('show.bs.modal', () => {
				hideErrorAlert();
				onOpen();
			});
			modal.addEventListener('shown.bs.modal', async () => {
				await tick();
				// Automatically set focus on first input element (if any)
				if (inputAutofocus) {
					const firstInput = document.querySelector(`#${id} input[type="text"]`);
					if (firstInput instanceof HTMLElement) {
						firstInput.focus();
					}
				}
				if (!focus) {
					restoreModalFocus();
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
	 * @param {(() => void)|undefined} finallyCallback Optional function to be executed at the end of the processing
	 * (both in case of success or failure)
	 */
	export async function confirmAndHide(confirm, finallyCallback = undefined) {
		// important: retrieve the modal before executing confirm(), because it could remove
		// the container element and then cause issues with the hide function
		const modal = getBootstrapModal();
		try {
			hideErrorAlert();
			await confirm();
			modal.hide();
		} catch (/** @type {any} */ error) {
			displayErrorAlert(error);
		} finally {
			if (finallyCallback) {
				finallyCallback();
			}
		}
	}

	export function hideErrorAlert() {
		if (errorAlert) {
			errorAlert.hide();
		}
	}

	export function displayErrorAlert(/** @type {any} */ error) {
		const errorAlertId = `errorAlert-${id}`;
		errorAlert = displayStandardErrorAlert(error, errorAlertId);
		if (scrollable) {
			const modalBody = document.querySelector('.modal.show .modal-body');
			const errorAlert = document.getElementById(errorAlertId);
			if (modalBody && errorAlert) {
				modalBody.scrollTo({
					top: errorAlert.getBoundingClientRect().y,
					behavior: 'smooth'
				});
			}
		}
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

	/**
	 * Restore focus on modal, otherwise it will not be possible to close it using the esc key
	 */
	export function restoreModalFocus() {
		const modal = document.querySelector('.modal.show');
		if (modal instanceof HTMLElement) {
			modal.focus();
		}
	}
</script>

<!-- Note: tabindex="-1" is needed to fix escape key not working in some cases -->
<!-- (see https://stackoverflow.com/a/12630531) -->
<!-- Note: data-bs-focus="false" is needed to avoid conflicts with slim-select -->
<!-- (see https://github.com/brianvoe/slim-select/issues/475#issuecomment-1736440245) -->
<div class="modal {size ? 'modal-' + size : ''}" {id} tabindex="-1" data-bs-focus={focus}>
	<div
		class="modal-dialog"
		class:modal-fullscreen={fullscreen}
		class:modal-dialog-centered={centered}
		class:modal-dialog-scrollable={scrollable}
	>
		<div class="modal-content">
			<div class="modal-header">
				{@render header?.()}
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body {bodyCss}">
				{@render body?.()}
			</div>
			{#if !!footer}
				<div class="modal-footer">
					{@render footer?.()}
				</div>
			{/if}
		</div>
	</div>
</div>
