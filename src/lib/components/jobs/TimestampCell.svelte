<script>
	/**
	 * @typedef {Object} Props
	 * @property {string|null} timestamp
	 */

	/** @type {Props} */
	let { timestamp } = $props();

	const date = $derived(getDate(timestamp));
	const time = $derived(getTime(timestamp));

	/**
	 * @param {string|null} timestamp
	 * @returns {string}
	 */
	function getDate(timestamp) {
		if (timestamp) {
			const dateObj = new Date(timestamp);
			return dateObj.toLocaleString([], {
				day: 'numeric',
				month: 'numeric',
				year: 'numeric'
			});
		} else {
			return '';
		}
	}

	/**
	 * @param {string|null} timestamp
	 * @returns {string}
	 */
	function getTime(timestamp) {
		if (timestamp) {
			const dateObj = new Date(timestamp);
			return dateObj.toLocaleString([], {
				hour: 'numeric',
				minute: 'numeric',
				second: 'numeric',
				hour12: false
			});
		} else {
			return '';
		}
	}
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
