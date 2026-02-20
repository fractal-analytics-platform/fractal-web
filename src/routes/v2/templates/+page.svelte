<script>
	import { page } from '$app/state';
	import TemplatesTable from '$lib/components/v2/templates/TemplatesTable.svelte';

	/** @type {import('fractal-components/types/api').TemplatePage} */
	let templatePage = $derived(page.data.templatePage);
</script>

<div class="container mt-3">
	<div class="row mt-2 mb-2">
		<div class="col">
			There are {templatePage.total_count} templates available.
		</div>
	</div>
</div>


<div class="container-fluid">
	<TemplatesTable  bind:templatePage/>
</div>
