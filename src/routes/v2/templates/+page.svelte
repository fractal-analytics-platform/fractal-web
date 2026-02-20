<script>
	import { page } from '$app/state';
	import TemplatesTable from '$lib/components/v2/templates/TemplatesTable.svelte';

	/** @type {import('fractal-components/types/api').TemplatePage} */
	let templatePage = $derived(page.data.templatePage);
</script>


<div class="container-fluid">
	<TemplatesTable  bind:templatePage/>
</div>
