import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { readable } from 'svelte/store';
import { data } from './mock/jobs-list';

// Mocking the page store
vi.mock('$app/stores', () => {
	return {
		page: readable({
			data
		})
	};
});
// Mocking public variables
vi.mock('$env/dynamic/public', () => {
	return { env: {} };
});

// Mocking fetch
global.fetch = vi.fn();

// Mocking window location
delete window.location;
global.window.location = {
	reload: vi.fn()
};

// The component to be tested must be imported after the mock setup
import JobsList from '../src/lib/components/jobs/JobsList.svelte';

describe('JobsList', () => {
	it('display, filter and sort jobs', async () => {
		const nop = function () {};
		const result = render(JobsList, {
			props: { jobUpdater: nop }
		});
		let table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(3);

		const filters = result.getAllByRole('combobox');

		const projectFilter = filters[0];
		verifyOptions(projectFilter, ['', '1', '2']);
		const workflowFilter = filters[1];
		verifyOptions(workflowFilter, ['', '1', '2']);
		const inputDatasetFilter = filters[2];
		verifyOptions(inputDatasetFilter, ['', '1', '2', '3', '4', '5', '6']);
		const outputDatasetFilter = filters[3];
		verifyOptions(outputDatasetFilter, ['', '1', '2', '3', '4', '5', '6']);
		const statusFilter = filters[4];
		verifyOptions(statusFilter, ['', 'running', 'done', 'failed', 'submitted']);

		// Filter by project
		await fireEvent.change(projectFilter, { target: { value: '1' } });
		table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(1);
		expect(table.querySelectorAll('tbody tr td')[5].textContent).eq('input1');
		await clearFilters(result);

		// Filter by workflow
		await fireEvent.change(workflowFilter, { target: { value: '2' } });
		table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(2);
		expect(table.querySelectorAll('tbody tr:nth-child(1) td')[5].textContent).eq('input3');
		expect(table.querySelectorAll('tbody tr:nth-child(2) td')[5].textContent).eq('input2');
		await clearFilters(result);

		// Filter by input dataset
		await fireEvent.change(inputDatasetFilter, { target: { value: '3' } });
		table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(1);
		expect(table.querySelectorAll('tbody tr td')[5].textContent).eq('input2');
		await clearFilters(result);

		// Filter by output dataset
		await fireEvent.change(outputDatasetFilter, { target: { value: '4' } });
		table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(1);
		expect(table.querySelectorAll('tbody tr td')[6].textContent).eq('output2');
		await clearFilters(result);

		// Filter by job status
		await fireEvent.change(statusFilter, { target: { value: 'running' } });
		table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(1);
		expect(table.querySelectorAll('tbody tr td')[5].textContent).eq('input3');
		await clearFilters(result);

		// Verify default sorting
		table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr:nth-child(1) td')[1].textContent).eq(
			'10/30/2023, 9:30:38 AM'
		);
		expect(table.querySelectorAll('tbody tr:nth-child(2) td')[1].textContent).eq(
			'10/30/2023, 9:15:38 AM'
		);
		expect(table.querySelectorAll('tbody tr:nth-child(3) td')[1].textContent).eq(
			'10/30/2023, 9:00:38 AM'
		);

		// Sort by start date
		const startDateSorter = table.querySelector('thead th:nth-child(2)');
		await fireEvent.click(startDateSorter);
		table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr:nth-child(1) td')[1].textContent).eq(
			'10/30/2023, 9:00:38 AM'
		);
		expect(table.querySelectorAll('tbody tr:nth-child(2) td')[1].textContent).eq(
			'10/30/2023, 9:15:38 AM'
		);
		expect(table.querySelectorAll('tbody tr:nth-child(3) td')[1].textContent).eq(
			'10/30/2023, 9:30:38 AM'
		);
	});

	async function clearFilters(result) {
		const clearFiltersBtn = result.getByRole('button', { name: 'Clear filters' });
		await fireEvent.click(clearFiltersBtn);
	}

	it('refresh jobs', async () => {
		const jobUpdater = function () {
			return data.jobs.map((j) => (j.status === 'running' ? { ...j, status: 'done' } : j));
		};
		const result = render(JobsList, {
			props: { jobUpdater }
		});
		let table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(3);
		expect(table.querySelectorAll('tbody tr:nth-child(1) td')[7].textContent).eq('running');
		expect(table.querySelectorAll('tbody tr:nth-child(2) td')[7].textContent).eq('failed');
		expect(table.querySelectorAll('tbody tr:nth-child(3) td')[7].textContent).eq('done');

		const refreshButton = result.getByRole('button', { name: 'Refresh' });
		await fireEvent.click(refreshButton);

		table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr:nth-child(1) td')[7].textContent).eq('done');
		expect(table.querySelectorAll('tbody tr:nth-child(2) td')[7].textContent).eq('failed');
		expect(table.querySelectorAll('tbody tr:nth-child(3) td')[7].textContent).eq('done');
	});

	it('cancel job', async () => {
		const nop = function () {};
		const result = render(JobsList, {
			props: { jobUpdater: nop }
		});
		let table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(3);

		fetch.mockResolvedValue({ ok: true });

		const cancelButton = result.getByRole('button', { name: 'Cancel' });
		await fireEvent.click(cancelButton);
		await new Promise(setTimeout);

		expect(window.location.reload).toHaveBeenCalledOnce();
	});

	it('error while cancelling job', async () => {
		const nop = function () {};
		const result = render(JobsList, {
			props: { jobUpdater: nop }
		});
		let table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(3);

		expect(result.queryAllByRole('alert').length).eq(0);

		fetch.mockResolvedValue({
			ok: false,
			json: () => new Promise((resolve) => resolve({ error: 'not implemented' }))
		});

		const cancelButton = result.getByRole('button', { name: 'Cancel' });
		await fireEvent.click(cancelButton);
		await new Promise(setTimeout);

		expect(result.queryAllByRole('alert').length).eq(1);
	});

	it('updates jobs in background', async () => {
		vi.useFakeTimers();
		try {
			const jobUpdater = function () {
				return data.jobs.map((j) => (j.status === 'running' ? { ...j, status: 'done' } : j));
			};
			const result = render(JobsList, {
				props: { jobUpdater }
			});
			let table = result.getByRole('table');
			expect(table.querySelectorAll('tbody tr').length).eq(3);
			expect(table.querySelectorAll('tbody tr:nth-child(1) td')[7].textContent).eq('running');
			expect(table.querySelectorAll('tbody tr:nth-child(2) td')[7].textContent).eq('failed');
			expect(table.querySelectorAll('tbody tr:nth-child(3) td')[7].textContent).eq('done');

			vi.advanceTimersByTime(3500);
			vi.useRealTimers();
			// trigger table update
			await new Promise(setTimeout);

			table = result.getByRole('table');
			expect(table.querySelectorAll('tbody tr:nth-child(1) td')[7].textContent).eq('done');
			expect(table.querySelectorAll('tbody tr:nth-child(2) td')[7].textContent).eq('failed');
			expect(table.querySelectorAll('tbody tr:nth-child(3) td')[7].textContent).eq('done');
		} finally {
			vi.useRealTimers();
		}
	});
});

function verifyOptions(element, expectedOptions) {
	const options = element.querySelectorAll('option');
	expect(options.length).eq(expectedOptions.length);
	for (let i = 0; i < options.length; i++) {
		expect(options[i].value).eq(expectedOptions[i]);
	}
}
