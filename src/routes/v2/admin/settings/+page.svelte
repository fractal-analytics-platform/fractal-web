<script>
	import { page } from '$app/state';

	const settings = page.data.settings;

	let showObfuscated = $state(false);
</script>

<div class="container mt-3">
	<h1 class="fw-light mb-2">Settings</h1>

	<div class="row mb-3">
		<div class="col">
			<div class="form-check form-switch float-end">
				<input
					class="form-check-input"
					bind:checked={showObfuscated}
					type="checkbox"
					role="switch"
					id="showObfuscatedSwitch"
				/>
				<label class="form-check-label" for="showObfuscatedSwitch">Show obfuscated fields</label>
			</div>
		</div>
	</div>

	<table class="table table-striped">
		<tbody>
			{#each Object.entries(settings) as [key, value]}
				{#if showObfuscated || value !== '**********'}
					<tr>
						<th>{key}</th>
						<td>{value}</td>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>
