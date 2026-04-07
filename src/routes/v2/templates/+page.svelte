<script>
	import { page } from '$app/state';
	import TemplatesTable from '$lib/components/v2/templates/TemplatesTable.svelte';

	/** @type {Array<[number, string]>} */
	const groups = $derived(page.data.user.group_ids_names || []);

	/** @type {number|undefined} */
	let templateId = $derived(
		page.url.searchParams.get('template_id')
			? Number(page.url.searchParams.get('template_id'))
			: undefined
	);
	/** @type {boolean} */
	let isOwner = $derived(page.url.searchParams.get('is_owner') === 'true');
	/** @type {string|undefined} */
	let userEmail = $derived(page.url.searchParams.get('user_email') || undefined);
	/** @type {string|undefined} */
	let templateName = $derived(page.url.searchParams.get('name') || undefined);
	/** @type {number|undefined} */
	let templateVersion = $derived(
		page.url.searchParams.get('version') ? Number(page.url.searchParams.get('version')) : undefined
	);
</script>

<div class="container-fluid">
	<TemplatesTable
		modalType="edit"
		{templateId}
		{isOwner}
		{userEmail}
		{templateName}
		{templateVersion}
		{groups}
	/>
</div>
