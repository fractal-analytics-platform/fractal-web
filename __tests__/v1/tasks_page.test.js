import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { readable } from 'svelte/store';

// Mocking public variables
vi.mock('$env/dynamic/public', () => {
	return { env: {} };
});

// Mocking the page store
vi.mock('$app/stores', () => {
	return {
		page: readable({
			data: {
				tasks: [
					{ id: 1, name: 'Apply Registration to Image', version: '0.13.1', owner: null },
					{ id: 2, name: 'Apply Registration to Image', version: '0.12.0', owner: null },
					{ id: 3, name: 'Apply Registration to Image', version: '0.10.0', owner: null },
					{ id: 4, name: 'Cellpose Segmentation', version: '0.13.1', owner: null },
					{ id: 5, name: 'Cellpose Segmentation', version: '0.12.0', owner: null },
					{ id: 6, name: 'Cellpose Segmentation', version: '0.10.0', owner: null },
					{ id: 7, name: 'Cellpose Segmentation', version: '0.10.0', owner: 'user1' },
					{ id: 8, name: 'task 2', version: '1.0.0', owner: 'user1' },
					{ id: 9, name: 'task 2', version: '0.5.0', owner: 'user1' },
					{ id: 10, name: 'task 3', version: '0.5.0', owner: 'user1' },
					{ id: 11, name: 'task 3', version: '0.4.0', owner: 'user1' },
					{ id: 12, name: 'task 3', version: '0.7.0', owner: 'user2' },
					{ id: 13, name: 'task 3', version: '0.6.0', owner: 'user2' },
					{ id: 14, name: 'task 3', version: '0.5.0', owner: 'user2' },
					{ id: 15, name: 'task 4', version: '0.5.0', owner: 'user2' },
					{ id: 16, name: 'task 4', version: '0.5.0', owner: 'user2' }
				]
			}
		})
	};
});

import page from '../../src/routes/v1/tasks/+page.svelte';

describe('Tasks page', () => {
	it('display the task table', async () => {
		const result = render(page);

		const [, ...rows] = result.getAllByRole('row');

		expect(rows.length).eq(16);

		const expandButtons = rows
			.map((r) => r.querySelector('td:nth-child(2) button'))
			.filter((b) => !!b);
		expect(expandButtons.length).eq(6);

		checkCollapsedRows(rows, [1, 2, 4, 5, 8, 10, 12, 13, 15]);

		// expand first group
		await fireEvent.click(expandButtons[0]);
		checkCollapsedRows(rows, [4, 5, 8, 10, 12, 13, 15]);

		// expand second group
		await fireEvent.click(expandButtons[1]);
		checkCollapsedRows(rows, [1, 2, 8, 10, 12, 13, 15]);

		// collapse second group
		await fireEvent.click(expandButtons[1]);
		checkCollapsedRows(rows, [1, 2, 4, 5, 8, 10, 12, 13, 15]);
	});
});

/**
 * @param {HTMLElement[]} rows
 * @param {number[]} indexes
 */
function checkCollapsedRows(rows, indexes) {
	for (let i = 0; i < rows.length; i++) {
		const collapsed = indexes.includes(i);
		expect(rows[i].classList.contains('collapsed'), `Row #${i}`).eq(collapsed);
	}
}
