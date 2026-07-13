import { vi, it, expect } from 'vitest';
import { removeDuplicatedItems } from '$lib/common/component_utilities.js';

// Mocking public variables
vi.mock('$env/dynamic/public', () => {
	return { env: {} };
});

it('removes duplicated datasets and sort by name', () => {
	const allDatasets = [
		{ id: 2, name: 'output' },
		{ id: 1, name: 'input' },
		{ id: 3, name: 'test' },
		{ id: 1, name: 'input' },
		{ id: 2, name: 'output' }
	];
	const datasets = removeDuplicatedItems(allDatasets);
	expect(datasets.length).toEqual(3);
	expect(datasets[0].id).toEqual(1);
	expect(datasets[0].name).toEqual('input');
	expect(datasets[1].id).toEqual(2);
	expect(datasets[1].name).toEqual('output');
	expect(datasets[2].id).toEqual(3);
	expect(datasets[2].name).toEqual('test');
});
