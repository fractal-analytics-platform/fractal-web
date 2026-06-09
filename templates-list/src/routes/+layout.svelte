<script>
	import 'bootstrap/dist/css/bootstrap.min.css';
	import 'bootstrap-icons/font/bootstrap-icons.css';
	import bootstrapScriptSrc from 'bootstrap/dist/js/bootstrap.bundle.js?url';
	import slimSelectCss from 'slim-select/styles?url';

	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();
</script>

<svelte:head>
	<script src={bootstrapScriptSrc}></script>
	<link rel="stylesheet" href={slimSelectCss} />
</svelte:head>

{@render children?.()}
