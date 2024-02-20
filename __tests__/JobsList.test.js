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

		const statusFilter = filters[0];
		verifyOptions(statusFilter, ['', 'submitted', 'done', 'failed']);
		const projectFilter = filters[1];
		verifyOptions(projectFilter, ['', '1', '2']);
		const workflowFilter = filters[2];
		verifyOptions(workflowFilter, ['', '1', '2']);
		const inputDatasetFilter = filters[3];
		verifyOptions(inputDatasetFilter, ['', '1', '3', '5']);
		const outputDatasetFilter = filters[4];
		verifyOptions(outputDatasetFilter, ['', '2', '4', '6']);

		// Filter by project
		await fireEvent.change(projectFilter, { target: { value: '1' } });
		table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(1);
		expect(table.querySelectorAll('tbody tr td')[7].textContent).eq('input1');
		await clearFilters(result);

		// Filter by workflow
		await fireEvent.change(workflowFilter, { target: { value: '2' } });
		table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(2);
		expect(table.querySelectorAll('tbody tr:nth-child(1) td')[7].textContent).eq('input3');
		expect(table.querySelectorAll('tbody tr:nth-child(2) td')[7].textContent).eq('input2');
		await clearFilters(result);

		// Filter by input dataset
		await fireEvent.change(inputDatasetFilter, { target: { value: '3' } });
		table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(1);
		expect(table.querySelectorAll('tbody tr td')[7].textContent).eq('input2');
		await clearFilters(result);

		// Filter by output dataset
		await fireEvent.change(outputDatasetFilter, { target: { value: '4' } });
		table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(1);
		expect(table.querySelectorAll('tbody tr td')[8].textContent).eq('output2');
		await clearFilters(result);

		// Filter by job status
		await fireEvent.change(statusFilter, { target: { value: 'submitted' } });
		table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(1);
		expect(table.querySelectorAll('tbody tr td')[7].textContent).eq('input3');
		await clearFilters(result);

		// Verify default sorting
		table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr:nth-child(1) td')[3].textContent).eq(
			'30/10/2023 10:30:38'
		);
		expect(table.querySelectorAll('tbody tr:nth-child(2) td')[3].textContent).eq(
			'30/10/2023 10:15:38'
		);
		expect(table.querySelectorAll('tbody tr:nth-child(3) td')[3].textContent).eq(
			'30/10/2023 10:00:38'
		);

		// Sort by start date
		const startDateSorter = table.querySelector('thead th:nth-child(4)');
		await fireEvent.click(startDateSorter);
		table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr:nth-child(1) td')[3].textContent).eq(
			'30/10/2023 10:00:38'
		);
		expect(table.querySelectorAll('tbody tr:nth-child(2) td')[3].textContent).eq(
			'30/10/2023 10:15:38'
		);
		expect(table.querySelectorAll('tbody tr:nth-child(3) td')[3].textContent).eq(
			'30/10/2023 10:30:38'
		);
	});

	async function clearFilters(result) {
		const clearFiltersBtn = result.getByRole('button', { name: 'Clear filters' });
		await fireEvent.click(clearFiltersBtn);
	}

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

		const message = result.getByText(/Job cancellation request received/);
		expect(message).toBeDefined();
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
				return data.jobs.map((j) => (j.status === 'submitted' ? { ...j, status: 'done' } : j));
			};
			const result = render(JobsList, {
				props: { jobUpdater }
			});
			let table = result.getByRole('table');
			expect(table.querySelectorAll('tbody tr').length).eq(3);
			expect(table.querySelectorAll('tbody tr:nth-child(1) td')[1].textContent).contain('submitted');
			expect(table.querySelectorAll('tbody tr:nth-child(2) td')[1].textContent).contain('failed');
			expect(table.querySelectorAll('tbody tr:nth-child(3) td')[1].textContent).contain('done');

			vi.advanceTimersByTime(3500);
			vi.useRealTimers();
			// trigger table update
			await new Promise(setTimeout);

			table = result.getByRole('table');
			expect(table.querySelectorAll('tbody tr:nth-child(1) td')[1].textContent).contain('done');
			expect(table.querySelectorAll('tbody tr:nth-child(2) td')[1].textContent).contain('failed');
			expect(table.querySelectorAll('tbody tr:nth-child(3) td')[1].textContent).contain('done');
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
