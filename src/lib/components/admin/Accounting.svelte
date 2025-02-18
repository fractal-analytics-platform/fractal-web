<script>
	import { arrayToCsv, downloadBlob, getTimestamp } from '$lib/common/component_utilities';
	import { displayStandardErrorAlert, getAlertErrorFromResponse } from '$lib/common/errors';
	import { sortDropdownUsers } from '$lib/components/admin/user_utilities';
	import Paginator from '$lib/components/common/Paginator.svelte';

	/** @type {Array<import('fractal-components/types/api').User>} */
	export let users = [];
	/** @type {number} */
	export let currentUserId;

	let searching = false;
	let exportingCsv = false;

	let dateMin = '';
	let timeMin = '';
	let dateMax = '';
	let timeMax = '';
	let userId = '';

	let currentPage = 1;
	let pageSize = 10;

	/** @type {import('fractal-components/types/api').Accounting|undefined} */
	let accounting = undefined;

	/** @type {import('$lib/components/common/StandardErrorAlert.svelte').default|undefined} */
	let errorAlert = undefined;

	/**
	 * @param {number} newCurrentPage
	 * @param {number} newPageSize
	 */
	async function search(newCurrentPage = currentPage, newPageSize = pageSize) {
		searching = true;
		accounting = await accountingQuery(newCurrentPage, newPageSize);
		searching = false;
		if (accounting) {
			pageSize = accounting.page_size;
			currentPage = accounting.current_page;
		}
	}

	async function exportCsv() {
		exportingCsv = true;
		const accounting = await accountingQuery(1, 1000000);
		exportingCsv = false;
		if (!accounting) {
			return;
		}
		const header = ['id', 'user_id', 'user_email', 'timestamp', 'num_tasks', 'num_new_images'];
		const rows = accounting.records.map((record) => [
			record.id,
			record.user_id,
			getUserById(record.user_id)?.email || '',
			record.timestamp,
			record.num_tasks,
			record.num_new_images
		]);
		const csv = arrayToCsv([header, ...rows]);
		downloadBlob(csv, 'accounting.csv', 'text/csv;charset=utf-8;');
	}

	/**
	 * @param {number} newCurrentPage
	 * @param {number} newPageSize
	 * @returns {Promise<import('fractal-components/types/api').Accounting|undefined>}
	 */
	async function accountingQuery(newCurrentPage, newPageSize) {
		errorAlert?.hide();
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
		const response = await fetch(
			`/api/admin/v2/accounting?page_size=${newPageSize}&page=${newCurrentPage}`,
			{
				method: 'POST',
				headers,
				credentials: 'include',
				body: JSON.stringify(params)
			}
		);
		if (response.ok) {
			return await response.json();
		} else {
			errorAlert = displayStandardErrorAlert(
				await getAlertErrorFromResponse(response),
				'errorAlert-accounting'
			);
		}
	}

	function reset() {
		dateMin = '';
		timeMin = '';
		dateMax = '';
		timeMax = '';
		userId = '';
		accounting = undefined;
	}

	/**
	 * @param {number} userId
	 */
	function getUserById(userId) {
		return users.find((u) => u.id === userId);
	}

	$: users = sortDropdownUsers(users, currentUserId);
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

<div id="errorAlert-accounting" />

<button class="btn btn-primary" on:click={() => search()} disabled={searching}>
	{#if searching}
		<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
	{/if}
	Search
</button>
<button class="btn btn-warning" on:click={reset}> Reset </button>

{#if accounting}
	<button class="btn btn-primary float-end" on:click={exportCsv} disabled={exportingCsv}>
		{#if exportingCsv}
			<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
		{/if}
		<i class="bi-download" />
		Export to CSV
	</button>
{/if}

{#if accounting}
	<table class="table table-striped mt-3">
		<thead>
			<tr>
				<th>Id</th>
				<th>User</th>
				<th>Timestamp</th>
				<th>Num. tasks</th>
				<th>Num. new images</th>
			</tr>
		</thead>
		<tbody>
			{#each accounting.records as row}
				<tr>
					<td>{row.id}</td>
					<td>{getUserById(row.user_id)?.email || row.user_id}</td>
					<td>{row.timestamp}</td>
					<td>{row.num_tasks}</td>
					<td>{row.num_new_images}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<Paginator {currentPage} {pageSize} totalCount={accounting.total_count} onPageChange={search} />
{/if}
