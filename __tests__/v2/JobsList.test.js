import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { within, waitFor } from '@testing-library/dom';
import { data } from '../mock/jobs-list';

// Mocking the page store
vi.mock('$app/state', () => {
	return {
		page: {
			data
		}
	};
});
// Mocking public variables
vi.mock('$env/dynamic/public', () => {
	return { env: {} };
});

// Mocking fetch
global.fetch = vi.fn();

// Mocking window location
// @ts-expect-error
delete window.location;
// @ts-expect-error
global.window.location = {
	reload: vi.fn()
};

// The component to be tested must be imported after the mock setup
import JobsList from '../../src/lib/components/v2/jobs/JobsList.svelte';

describe('JobsList', () => {
	it('display, filter and sort jobs', async () => {
		const user = userEvent.setup();
		const result = render(JobsList, {
			props: { jobUpdater: vi.fn() }
		});
		let table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(3);

		const filters = result.getAllByRole('listbox', { hidden: false });
		expect(filters.length).eq(5);

		const statusFilter = filters[0];
		verifyOptions(statusFilter, ['Submitted', 'Done', 'Failed']);
		const projectFilter = filters[1];
		verifyOptions(projectFilter, ['project 1', 'project 2']);
		const workflowFilter = filters[2];
		verifyOptions(workflowFilter, ['workflow 1', 'workflow 2']);
		const userFilter = filters[4];
		verifyOptions(userFilter, ['admin@fractal.xy']);

		// Filter by project
		const optionProject1 = within(projectFilter).getByRole('option', { name: 'project 1' });
		await user.click(optionProject1);
		table = result.getByRole('table');
		await waitFor(() => expect(table.querySelectorAll('tbody tr').length).eq(1));
		expect(table.querySelectorAll('tbody tr td')[7].textContent).eq('dataset1');
		verifyOptions(workflowFilter, ['workflow 1']);
		await clearFilters(result);

		// Filter by workflow
		const optionWorkflow2 = within(workflowFilter).getByRole('option', { name: 'workflow 2' });
		await user.click(optionWorkflow2);
		table = result.getByRole('table');
		await waitFor(() => expect(table.querySelectorAll('tbody tr').length).eq(2));
		expect(table.querySelectorAll('tbody tr:nth-child(2) td')[7].textContent).eq('dataset2');
		await clearFilters(result);

		// Filter by job status
		const optionSubmitted = within(statusFilter).getByRole('option', { name: 'Submitted' });
		await user.click(optionSubmitted);
		table = result.getByRole('table');
		await waitFor(() => expect(table.querySelectorAll('tbody tr').length).eq(1));
		expect(table.querySelectorAll('tbody tr td')[7].textContent).eq('dataset3');
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
		const startDateSorter = /** @type {Element} */ (table.querySelector('thead th:nth-child(4)'));
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
		const table = result.getByRole('table');
		await waitFor(() => expect(table.querySelectorAll('tbody tr').length).eq(3));
	}

	it('cancel job', async () => {
		const result = render(JobsList, {
			props: { jobUpdater: vi.fn() }
		});
		let table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(3);

		/** @type {import('vitest').Mock} */ (fetch).mockResolvedValue({ ok: true });

		const cancelButton = result.getByRole('button', { name: 'Cancel' });
		await fireEvent.click(cancelButton);
		await new Promise((resolve) => setTimeout(resolve));

		const message = result.getByText(/Job cancellation request received/);
		expect(message).toBeDefined();
	});

	it('error while cancelling job', async () => {
		const result = render(JobsList, {
			props: { jobUpdater: vi.fn() }
		});
		let table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(3);

		expect(result.queryAllByRole('alert').length).eq(0);

		/** @type {import('vitest').Mock} */ (fetch).mockResolvedValue({
			ok: false,
			json: () => new Promise((resolve) => resolve({ error: 'not implemented' }))
		});

		const cancelButton = result.getByRole('button', { name: 'Cancel' });
		await fireEvent.click(cancelButton);
		await new Promise((resolve) => setTimeout(resolve));

		expect(result.queryAllByRole('alert').length).eq(1);
	});

	it('updates jobs in background', async () => {
		vi.useFakeTimers();
		try {
			/** @type {() => Promise<import('fractal-components/types/api').ApplyWorkflowV2[]>} */
			const jobUpdater = async function () {
				return data.jobs.map((j) => (j.status === 'submitted' ? { ...j, status: 'done' } : j));
			};
			const result = render(JobsList, {
				props: { jobUpdater }
			});
			let table = result.getByRole('table');
			expect(table.querySelectorAll('tbody tr').length).eq(3);
			expect(table.querySelectorAll('tbody tr:nth-child(1) td')[1].textContent).contain(
				'submitted'
			);
			expect(table.querySelectorAll('tbody tr:nth-child(2) td')[1].textContent).contain('failed');
			expect(table.querySelectorAll('tbody tr:nth-child(3) td')[1].textContent).contain('done');

			vi.advanceTimersByTime(3500);
			vi.useRealTimers();
			// trigger table update
			await new Promise((resolve) => setTimeout(resolve));

			table = result.getByRole('table');
			expect(table.querySelectorAll('tbody tr:nth-child(1) td')[1].textContent).contain('done');
			expect(table.querySelectorAll('tbody tr:nth-child(2) td')[1].textContent).contain('failed');
			expect(table.querySelectorAll('tbody tr:nth-child(3) td')[1].textContent).contain('done');
		} finally {
			vi.useRealTimers();
		}
	});

	it('pre-select dataset', async () => {
		const result = render(JobsList, {
			props: { jobUpdater: vi.fn(), selectedDataset: '2' }
		});
		let table = result.getByRole('table');
		expect(table.querySelectorAll('tbody tr').length).eq(1);
	});
});

function verifyOptions(element, expectedOptions) {
	const options = within(element).getAllByRole('option');
	expect(options.length).eq(expectedOptions.length);
	for (let i = 0; i < options.length; i++) {
		expect(options[i].textContent).eq(expectedOptions[i]);
	}
}
