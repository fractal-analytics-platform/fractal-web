<script>
	import { getTimestamp, hideAllTooltips } from '$lib/common/component_utilities';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import { onDestroy } from 'svelte';
	import CopyToClipboardButton from '../common/CopyToClipboardButton.svelte';

	
	/**
	 * @typedef {Object} Props
	 * @property {Array<import('fractal-components/types/api').User>} [users]
	 */

	/** @type {Props} */
	let { users = [] } = $props();

	let searching = $state(false);
	let searched = $state(false);

	let dateMin = $state('');
	let timeMin = $state('');
	let dateMax = $state('');
	let timeMax = $state('');
	let userId = $state('');

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/** @type {number[]} */
	let ids = $state([]);

	/** @type {CopyToClipboardButton|undefined} */
	let copyToClipboardButton = $state(undefined);

	async function slurmAccountingQuery() {
		errorAlert?.hide();
		searching = true;
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		const params = {};
		const timestampMin = getTimestamp(dateMin, timeMin);
		if (timestampMin) {
			params.timestamp_min = timestampMin;
		}
		const timestampMax = getTimestamp(dateMax, timeMax);
		if (timestampMax) {
			params.timestamp_max = timestampMax;
		}
		if (userId) {
			params.user_id = userId;
		}
		const response = await fetch(`/api/admin/v2/accounting/slurm`, {
			method: 'POST',
			headers,
			credentials: 'include',
			body: JSON.stringify(params)
		});
		if (response.ok) {
			ids = await response.json();
			searched = true;
		} else {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'errorAlert-slurm-accounting'
			);
		}
		searching = false;
	}

	function reset() {
		dateMin = '';
		timeMin = '';
		dateMax = '';
		timeMax = '';
		userId = '';
		ids = [];
		searched = false;
		copyToClipboardButton?.reset();
	}

	onDestroy(() => {
		hideAllTooltips();
	});
</script>

<div class="row mt-3 mb-3">
	<div class="col-md-3 col-lg-2 mt-2">User</div>
	<div class="col-md-9 col-lg-10">
		<div class="row row-cols-md-auto">
			<div class="col-12 mt-1">
				<select class="form-select" bind:value={userId} id="user">
					<option value="">All</option>
					{#each users as user}
						<option value={user.id}>{user.email}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>
</div>

<div class="row mt-3 mb-3">
	<div class="col-md-3 col-lg-2 mt-2">Timestamp</div>
	<div class="col-md-9 col-lg-10">
		<div class="row row-cols-md-auto">
			<div class="col-12 mt-1">
				<div class="input-group">
					<div class="input-group-text">Min</div>
					<input type="date" class="form-control" bind:value={dateMin} id="date_min" />
					<input type="time" class="form-control" bind:value={timeMin} id="time_min" />
				</div>
			</div>
			<div class="col-12 mt-1">
				<div class="input-group">
					<div class="input-group-text">Max</div>
					<input type="date" class="form-control" bind:value={dateMax} id="date_max" />
					<input type="time" class="form-control" bind:value={timeMax} id="time_max" />
				</div>
			</div>
		</div>
	</div>
</div>

<div id="errorAlert-accounting"></div>

<button class="btn btn-primary" onclick={slurmAccountingQuery} disabled={searching}>
	{#if searching}
		<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
	{/if}
	Search
</button>
<button class="btn btn-warning" onclick={reset}> Reset </button>

{#if searched}
	<p class="text-center">
		The query returned {ids.length}
		{ids.length === 1 ? 'result' : 'results'}
	</p>
	<div class="card" class:d-none={ids.length === 0}>
		<div class="card-body d-flex flex-row">
			<div class="text-break flex-fill">
				{#each ids as id}
					<span class="font-monospace me-2">{id}</span>
				{/each}
			</div>
			<div class="copy-text-wrapper float-end mt-2">
				<CopyToClipboardButton
					bind:this={copyToClipboardButton}
					id="copy-text-btn"
					clipboardText={ids.join(' ')}
					text="Copy text"
				/>
			</div>
		</div>
	</div>
{/if}

<style>
	.copy-text-wrapper {
		min-width: 150px;
	}
</style>
