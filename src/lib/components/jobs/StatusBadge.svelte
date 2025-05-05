<script>
	
	/**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').JobStatus|null} [status]
	 */

	/** @type {Props} */
	let { status = null } = $props();

	/**
	 * @param {import('fractal-components/types/api').JobStatus|null} status
	 */
	function getLabelStyle(status) {
		switch (status) {
			case 'submitted':
				return 'badge text-bg-info';
			case 'done':
				return 'badge text-bg-success';
			case 'failed':
				return 'badge text-bg-danger';
		}
	}
	let labelStyle = $derived(getLabelStyle(status));
</script>

<span class={labelStyle}>
	{status}
</span>
