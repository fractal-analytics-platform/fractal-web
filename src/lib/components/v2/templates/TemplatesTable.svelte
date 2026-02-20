<script>
    /**
	 * @typedef {Object} Props
	 * @property {import('fractal-components/types/api').TemplatePage} templatePage
	 */
	/** @type {Props} */
	let {templatePage = $bindable()} = $props();
</script>

{#each templatePage.items as template}
    <div>
        {template.user_email}, {template.name}, {template.version}
    </div>
{/each}