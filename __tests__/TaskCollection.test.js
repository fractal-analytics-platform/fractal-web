import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, act } from '@testing-library/svelte';

// Mocking fetch
global.fetch = vi.fn();

function createFetchResponse(data) {
	return {
		ok: true,
		json: () => new Promise((resolve) => resolve(data))
	};
}

// Mocking public variables
vi.mock('$env/dynamic/public', () => {
	return { env: {} };
});

// The component to be tested must be imported after the mock setup
import TaskCollection from '../src/lib/components/tasks/TaskCollection.svelte';

describe('TaskCollection', () => {
	it('collect tasks with pinned package versions', async () => {
		render(TaskCollection);

		const addPpvBtn = screen.getByRole('button', { name: 'Add pinned package version' });

		expect(screen.getAllByRole('textbox').length).eq(4);

		// add ppv
		await fireEvent.click(addPpvBtn);
		expect(screen.getAllByRole('textbox').length).eq(6);
		await fireEvent.click(addPpvBtn);
		await fireEvent.click(addPpvBtn);
		expect(screen.getAllByRole('textbox').length).eq(10);

		// remove ppv
		const removePpvBtn = screen.getAllByRole('button', {
			name: 'Remove pinned package version'
		})[1];
		await fireEvent.click(removePpvBtn);
		expect(screen.getAllByRole('textbox').length).eq(8);

		const [key1, key2] = screen.getAllByRole('textbox', { name: 'Name' });
		const [value1, value2] = screen.getAllByRole('textbox', { name: 'Version' });

		await fireEvent.input(key1, { target: { value: 'package1' } });
		await fireEvent.input(value1, { target: { value: '1.2.3' } });
		await fireEvent.input(key2, { target: { value: 'package2' } });
		await fireEvent.input(value2, { target: { value: '0.0.8' } });

		const packageInput = screen.getByRole('textbox', { name: 'Package' });
		await fireEvent.input(packageInput, { target: { value: 'main-package' } });

		fetch.mockResolvedValue({
			ok: true,
			status: 201,
			json: () =>
				new Promise((resolve) =>
					resolve({
						data: {
							status: 'pending'
						}
					})
				)
		});

		const collectBtn = screen.getByRole('button', { name: 'Collect' });
		await fireEvent.click(collectBtn);

		expect(fetch).toHaveBeenCalledWith(
			'/api/v1/task/collect/pip',
			expect.objectContaining({
				body: JSON.stringify({
					package: 'main-package',
					pinned_package_versions: {
						package1: '1.2.3',
						package2: '0.0.8'
					}
				})
			})
		);

		await new Promise(setTimeout);
		expect(screen.getAllByRole('textbox').length).eq(4);
	});

	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	afterEach(() => {
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
	});

	it('Update tasks collection in background', async () => {
		const coll1 = {
			id: 5,
			status: 'OK',
			pkg: 'fractal-tasks-core',
			package_version: '0.11.0',
			timestamp: '2023-12-14T10:47:03.372651'
		};
		const coll2 = {
			id: 6,
			status: 'installing',
			pkg: 'fractal-tasks-core',
			package_version: '0.12.1',
			timestamp: '2023-12-14T10:47:03.372651'
		};

		const storageContent = JSON.stringify([coll1, coll2]);
		window.localStorage.setItem('TaskCollections', storageContent);

		fetch
			.mockResolvedValueOnce(
				createFetchResponse({
					id: 5,
					data: { status: 'OK', logs: '...' }
				})
			)
			.mockResolvedValueOnce(
				createFetchResponse({
					id: 6,
					data: { status: 'installing', logs: '...' }
				})
			)
			.mockResolvedValueOnce(
				createFetchResponse({
					id: 6,
					data: { status: 'fail', logs: '...' }
				})
			);

		const result = render(TaskCollection);

		const table = result.getAllByRole('table')[0];
		let rows = table.querySelectorAll('tbody tr');
		expect(rows.length).eq(2);

		let statuses = getStatuses(rows);
		expect(statuses[0]).eq('OK');
		expect(statuses[1]).eq('installing');

		await act(() => vi.runOnlyPendingTimersAsync());

		rows = table.querySelectorAll('tbody tr');
		expect(rows.length).eq(2);

		statuses = getStatuses(rows);
		expect(statuses[0]).eq('OK');
		expect(statuses[1]).eq('fail');
	});
});

/**
 * @param {NodeListOf<Element>} rows
 */
function getStatuses(rows) {
	const statuses = [];
	for (const row of rows) {
		statuses.push(row.querySelectorAll('td')[3].textContent);
	}
	return statuses;
}
