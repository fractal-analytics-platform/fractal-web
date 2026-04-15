<script>
	import { onMount, onDestroy } from 'svelte';

	export let templateId;
	export let placement = 'right';

	let triggerEl;
	let popoverEl;
	let open = false;

	let description = null;

	async function fetchDescription() {
		try {
			const res = await fetch(`/api/v2/workflow-template/${templateId}`);
			const json = await res.json();
			description = json.description;
		} catch (e) {
			description = 'Error loading description';
		}
	}

	async function toggle() {
		description = null;
		open = !open;
		if (open) {
			await fetchDescription();
		}
	}

	function handleClickOutside(event) {
		const path = event.composedPath();
		if (!path.includes(triggerEl) && !path.includes(popoverEl)) {
			open = false;
		}
	}

	onMount(() => {
		window.addEventListener('click', handleClickOutside);
	});

	onDestroy(() => {
		window.removeEventListener('click', handleClickOutside);
	});
</script>

<span class="wrapper">
	<button bind:this={triggerEl} on:click={toggle} class="unstyled-button">
		<slot name="trigger" />
	</button>

	{#if open}
		<div bind:this={popoverEl} class="popover-box {placement}">
			{description}
		</div>
	{/if}
</span>

<style>
	.popover-box {
		position: absolute;
		z-index: 1000;
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 8px 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		white-space: nowrap;
	}

	.right {
		top: 50%;
		left: 110%;
		transform: translateY(-50%);
	}
	.left {
		top: 50%;
		right: 110%;
		transform: translateY(-50%);
	}
	.top {
		bottom: 110%;
		left: 50%;
		transform: translateX(-50%);
	}
	.bottom {
		top: 110%;
		left: 50%;
		transform: translateX(-50%);
	}

	.wrapper {
		position: relative;
		display: inline-block;
		cursor: pointer;
	}

	.unstyled-button {
		all: unset;
		cursor: pointer;
		display: inline-flex;
	}
</style>
