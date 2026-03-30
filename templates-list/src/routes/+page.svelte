<script>
	import { onMount } from 'svelte';
	import TemplatesList from '../lib/TemplatesList.svelte';
	
	/** @type {import('$lib/types').TemplateEntry[]} */
	let templates = $state([]);

    let template_id_map = $state({});

    onMount(async () => {
        const response = await fetch('/templates-table/static/templates.json');
        templates = await response.json();

        const response2 = await fetch('/templates-table/static/template_id_map.json');
        template_id_map = await response2.json();

    });
</script>

<TemplatesList {templates} {template_id_map}/>
