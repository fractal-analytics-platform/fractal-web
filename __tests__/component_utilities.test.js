import { it, expect } from 'vitest';
import {
	removeDuplicatedItems,
	sortProjectsByTimestampCreatedDesc
} from '$lib/common/component_utilities.js';

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

it('sort projects by timestamp_created DESC', () => {
	const projects = [
		{ name: 'p1', read_only: false, id: 2, timestamp_created: '2024-01-29T09:34:40.687256+00:00' },
		{ name: 'p3', read_only: false, id: 5, timestamp_created: '2024-01-29T09:36:40.380260+00:00' },
		{ name: 'p2', read_only: false, id: 4, timestamp_created: '2024-01-29T09:35:20.571999+00:00' }
	];

	sortProjectsByTimestampCreatedDesc(projects);

	expect(projects[0].name).eq('p3');
	expect(projects[1].name).eq('p2');
	expect(projects[2].name).eq('p1');
});
