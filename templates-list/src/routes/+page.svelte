<script>
	import { onMount } from 'svelte';
	import TemplatesList from '../lib/TemplatesList.svelte';
	
	/** @type {import('$lib/types').TemplateEntry[]} */
	let templates = $state([]);

    let templateIdMap = $state({});

    onMount(async () => {
        const response = await fetch('/templates-table/templates.json');
        templates = await response.json();

        const response2 = await fetch('/templates-table/template_id_map.json');
        templateIdMap = await response2.json();

    });
</script>

<TemplatesList {templates} {templateIdMap}/>
