<script>
	import { onMount } from 'svelte';
	import TemplatesList from '../lib/TemplatesList.svelte';
	
	/** @type {import('$lib/types').TemplateEntry[]} */
	let templates = $state([]);

    onMount(async () => {
        const response = await fetch('/templates-table/templates.json');
        templates = await response.json();
    });
</script>

<TemplatesList {templates}/>
