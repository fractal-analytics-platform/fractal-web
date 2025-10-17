<script>
	import { page } from '$app/state';

	const appSettings = $derived(page.data.appSettings);
	const databaseSettings = $derived(page.data.databaseSettings);
	const emailSettings = $derived(page.data.emailSettings);

	let showObfuscated = $state(false);

	const settings = $derived([
		['App settings', appSettings],
		['Database settings', databaseSettings],
		['E-mail settings', emailSettings]
	]);
</script>

<div class="container mt-3">
	<div class="row mb-3">
		<div class="col">
			<div class="form-check form-switch float-end mt-3">
				<input
					class="form-check-input"
					bind:checked={showObfuscated}
					type="checkbox"
					role="switch"
					id="showObfuscatedSwitch"
				/>
				<label class="form-check-label" for="showObfuscatedSwitch">Show obfuscated fields</label>
			</div>
			<h1 class="fw-light">Settings</h1>
		</div>
	</div>

	{#each settings as [title, s] (title)}
		<h3 class="fw-light mt-4">{title}</h3>
		<table class="table table-striped">
			<tbody>
				{#each Object.entries(s) as [key, value] (key)}
					{#if showObfuscated || value !== '**********'}
						<tr>
							<th>{key}</th>
							<td>{value}</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	{/each}
</div>
