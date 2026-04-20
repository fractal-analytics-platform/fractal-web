<script>
	import { getTimestamp } from '$lib/common/component_utilities';

	let excludeZeroJobs = $state(false);

	const currentYear = new Date().getFullYear();
	const years = Array.from({ length: currentYear - 2023 + 1 }, (_, i) => String(2023 + i));

	/** @type {string|undefined} */
	let startMonth = $state(undefined);
	/** @type {string|undefined} */
	let startYear = $state(undefined);

	function buildFilename() {
		if (startMonth && startYear) {
			return `users-${startYear}-${startMonth}.csv`;
		} else {
			return 'users-all-time.csv';
		}
	}

	async function downloadCsv() {
		const url = new URL('api/admin/v2/users-csv', window.location.origin);
		if (excludeZeroJobs) {
			url.searchParams.append('exclude_zero_jobs', 'true');
		}
		if (startMonth && startYear) {
			url.searchParams.append(
				'start_timestamp_min',
				String(getTimestamp(`${startYear}-${startMonth}-01`, '00:01'))
			);
			if (startMonth == '12') {
				const nextYear = String(Number(startYear) + 1);
				console.log(nextYear);
				url.searchParams.append(
					'start_timestamp_max',
					String(getTimestamp(`${nextYear}-01-01`, '00:01'))
				);
			} else {
				const nextMonth = String(Number(startMonth) + 1).padStart(2, '0');
				url.searchParams.append(
					'start_timestamp_max',
					String(getTimestamp(`${startYear}-${nextMonth}-01`, '00:01'))
				);
			}
		}

		const response = await fetch(url);

		if (!response.ok) {
			alert('Failed to download CSV');
			return;
		}

		const blob = await response.blob();
		const downloadUrl = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = downloadUrl;
		a.download = buildFilename();
		document.body.appendChild(a);
		a.click();

		a.remove();
		URL.revokeObjectURL(downloadUrl);
	}
</script>

<div class="container mt-3">
	<h1 class="fw-light mb-4">Download users info</h1>

	<div class="container mt-3">
		<div class="row mt-3">
			<div class="col-md-3 col-lg-3 mt-2">Restrict to jobs started on:</div>
			<div class="col-md-9 col-lg-9">
				<div class="row row-cols-md-auto">
					<div class="col-12 mt-1">
						<select
							class="form-select {!startMonth && startYear ? 'is-invalid' : ''}"
							aria-label="Select job starting month"
							bind:value={startMonth}
						>
							<option value={undefined}>---</option>
							<option value="01">January</option>
							<option value="02">February</option>
							<option value="03">March</option>
							<option value="04">April</option>
							<option value="05">May</option>
							<option value="06">June</option>
							<option value="07">July</option>
							<option value="08">August</option>
							<option value="09">September</option>
							<option value="10">October</option>
							<option value="11">November</option>
							<option value="12">December</option>
						</select>
					</div>
					<div class="col-12 mt-1">
						<select
							class="form-select {startMonth && !startYear ? 'is-invalid' : ''}"
							aria-label="Select job starting year"
							bind:value={startYear}
						>
							<option value={undefined}>---</option>
							{#each years as year}
								<option value={year}>{String(year)}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
		</div>

		<div class="row mt-3">
			<div class="col-md-3 col-lg-3 mt-2">Exclude users with no jobs:</div>
			<div class="col-md-9 col-lg-9">
				<div class="row row-cols-md-auto">
					<div class="col-12 mt-1">
						<input type="checkbox" class="form-check-input" bind:checked={excludeZeroJobs} />
					</div>
				</div>
			</div>
		</div>
	</div>

	<button
		class="btn btn-primary mt-4"
		onclick={downloadCsv}
		disabled={!!startMonth !== !!startYear}
	>
		Download CSV
	</button>
</div>
