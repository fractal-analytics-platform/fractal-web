<script>
	/** @type {import('$lib/types').JobStatus|null} */
	export let status = null;
	$: labelStyle = getLabelStyle(status);

	/**
	 * @param {import('$lib/types').JobStatus|null} status
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
</script>

<span class={labelStyle}>
	{status}
</span>
