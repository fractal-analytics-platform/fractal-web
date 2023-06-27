<script>
	import { onMount } from 'svelte';

	export let description = undefined;

	onMount(() => {
		const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
		// eslint-disable-next-line no-undef
		popoverTriggerList.forEach(popoverEl => new bootstrap.Popover(popoverEl));
	});

</script>

<span class='ms-2'>
  {#if description }
    <a tabindex='0' role='button' data-bs-trigger='focus' class='bi bi-info-circle' data-bs-toggle='popover'
       data-bs-title='Argument description' data-bs-content={description}></a>
  {/if}
</span>