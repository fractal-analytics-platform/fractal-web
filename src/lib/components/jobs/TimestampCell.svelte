<script>
	import { run } from 'svelte/legacy';

	
	/**
	 * @typedef {Object} Props
	 * @property {string|null} timestamp
	 */

	/** @type {Props} */
	let { timestamp } = $props();

	let date = $state('');
	let time = $state('');

	run(() => {
		if (timestamp) {
			const dateObj = new Date(timestamp);
			date = dateObj.toLocaleString([], {
				day: 'numeric',
				month: 'numeric',
				year: 'numeric'
			});
			time = dateObj.toLocaleString([], {
				hour: 'numeric',
				minute: 'numeric',
				second: 'numeric',
				hour12: false
			});
		} else {
			date = '';
			time = '';
		}
	});
</script>

{#if date === ''}
	-
{:else}
	<span class="nowrap">{date}</span>
	<span class="nowrap">{time}</span>
{/if}

<style>
	.nowrap {
		display: inline-block;
	}
</style>
