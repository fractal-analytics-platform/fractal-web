<script>
	import { currentHelpLink } from '$lib/stores';
	import { onDestroy } from 'svelte';
	import Modal from './Modal.svelte';

	/** @type {Modal|undefined} */
	let modal = $state();
	let helpLink = $state('');

	const unsubscribe = currentHelpLink.subscribe(async (link) => {
		helpLink = link;
		if (link) {
			window.addEventListener('message', listenIframeMessage);
			modal?.show();
		} else {
			window.removeEventListener('message', listenIframeMessage);
		}
	});

	function onClose() {
		currentHelpLink.set('');
	}

	/**
	 * @param {MessageEvent} event
	 */
	function listenIframeMessage(event) {
		if (event.origin !== location.origin) {
			console.warn(`Invalid origin: ${event.origin}`);
			return;
		}
		if (event.data.type === 'helpLink') {
			window.location = event.data.data;
		}
	}

	onDestroy(unsubscribe);
</script>

<Modal id="helpModal" size="xl" bind:this={modal} {onClose}>
	{#snippet header()}
		Help
	{/snippet}
	{#snippet body()}
		{#if helpLink}
			<iframe title="Help Page" src={helpLink} style="width: 100%; height: 100%"></iframe>
		{/if}
	{/snippet}
</Modal>

<style>
	:global(#helpModal .modal-body) {
		min-height: calc(100vh - 150px);
	}
</style>
