<script>
	/** @type {import('$lib/types').JobStatus|null} */
	export let status = null;
	let labelStyle = null;

	switch (status) {
		case 'submitted':
			labelStyle = 'badge text-bg-info';
			break;
		case 'running':
			labelStyle = 'badge text-bg-primary';
			break;
		case 'done':
			labelStyle = 'badge text-bg-success';
			break;
		case 'failed':
			labelStyle = 'badge text-bg-danger';
			break;
	}
</script>

<span class={labelStyle}>
	{status}
</span>
