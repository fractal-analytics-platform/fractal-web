<script>
	import { currentHelpLink } from '$lib/stores';
	import { onDestroy } from 'svelte';
	import Modal from './Modal.svelte';

	/** @type {Modal|undefined} */
	let modal = $state();
	let helpLink = $state('');

	// @ts-ignore
	// eslint-disable-next-line no-undef
	let clientVersion = __APP_VERSION__;

	const unsubscribe = currentHelpLink.subscribe(async (link) => {
		if (link) {
			const url = new URL(link, window.location.origin);
			// Appending version to prevent browser cache issues
			url.searchParams.append('v', clientVersion);
			helpLink = url.toString();
			modal?.show();
		} else {
			helpLink = '';
		}
	});

	function onClose() {
		currentHelpLink.set('');
	}

	onDestroy(unsubscribe);
</script>

<Modal id="helpModal" size="xl" bind:this={modal} {onClose}>
	{#snippet header()}
		Help
	{/snippet}
	{#snippet body()}
		{#if helpLink}
			<iframe title="Help Page" src={helpLink}></iframe>
		{/if}
	{/snippet}
</Modal>

<style>
	:global(#helpModal .modal-body) {
		min-height: calc(100vh - 150px);
		position: relative;
	}
	:global(#helpModal iframe) {
		position: absolute;
		width: calc(100% - 30px);
		height: calc(100% - 30px);
	}
</style>
