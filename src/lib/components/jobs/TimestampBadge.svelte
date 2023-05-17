<script>
	export let timestamp;
</script>

<span>
	{timestamp ? new Date(timestamp).toLocaleString() : 'No timestamp'}
</span>
