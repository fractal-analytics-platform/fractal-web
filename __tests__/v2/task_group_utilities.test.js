import { it, describe, expect } from 'vitest';
import {
	buildTaskTableRows,
	buildWorkflowTaskTableRows,
	removeIdenticalTaskGroups
} from '$lib/components/v2/tasks/task_group_utilities.js';

describe('task_group_utilities', () => {
	it('buildTaskTableRows selects the latest version', async () => {
		const taskGroups = [
			{ id: 1, pkg_name: 'name', task_list: [{ id: 2 }, { id: 1 }], version: '1.0.0' },
			{ id: 2, pkg_name: 'name', task_list: [], version: '1.2.0' }
		];
		const result = buildTaskTableRows(taskGroups, 'pkg_name');
		expect(result[0].selectedVersion).eq('1.2.0');
		// check that tasks are sorted by id
		expect(result[0].groups['1.0.0'].task_list[0].id).eq(1);
		expect(result[0].groups['1.0.0'].task_list[1].id).eq(2);
	});

	it('removeIdenticalTaskGroups', () => {
		const user = {
			id: 1,
			group_ids_names: [
				[11, 'All'],
				[22, 'older team'],
				[33, 'recent team']
			]
		};

		const taskGroups = [
			{ pkg_name: 'mypkg', version: '1.1.1', user_id: 1, user_group_id: null, task_list: [] },
			{ pkg_name: 'mypkg', version: '1.1.1', user_id: 2, user_group_id: 11, task_list: [] },
			{ pkg_name: 'mypkg', version: '1.1.1', user_id: 2, user_group_id: 22, task_list: [] },
			{ pkg_name: 'mypkg', version: '1.1.1', user_id: 2, user_group_id: 33, task_list: [] },
			{ pkg_name: 'mypkg', version: '2.2.2', user_id: 2, user_group_id: 11, task_list: [] },
			{ pkg_name: 'mypkg', version: '2.2.2', user_id: 2, user_group_id: 22, task_list: [] },
			{ pkg_name: 'mypkg', version: '2.2.2', user_id: 2, user_group_id: 33, task_list: [] },
			{ pkg_name: 'mypkg', version: '3.3.3', user_id: 2, user_group_id: 33, task_list: [] },
			{ pkg_name: 'mypkg', version: '3.3.3', user_id: 2, user_group_id: 22, task_list: [] },
			{ pkg_name: 'mypkg', version: null, user_id: 1, user_group_id: 11, task_list: [] },
			{ pkg_name: 'mypkg', version: null, user_id: 2, user_group_id: 11, task_list: [] }
		];

		const filteredTaskGroups = removeIdenticalTaskGroups(taskGroups, user);

		expect(filteredTaskGroups).toHaveLength(4);
		expect(filteredTaskGroups[0].version).eq('1.1.1');
		expect(filteredTaskGroups[1].version).eq('2.2.2');
		expect(filteredTaskGroups[2].version).eq('3.3.3');
		expect(filteredTaskGroups[3].version).eq(null);
	});

	it('buildWorkflowTaskTableRows groups by pkg_name', async () => {
		const taskGroups = [
			{ id: 3, pkg_name: 'p2', task_list: [{ id: 6 }, { id: 5 }], version: '3.0.0' },
			{
				id: 1,
				pkg_name: 'p1',
				task_list: [
					{ id: 2, name: 'p1t2' },
					{ id: 1, name: 'p1t1' }
				],
				version: '1.0.0'
			},
			{
				id: 2,
				pkg_name: 'p1',
				task_list: [
					{ id: 4, name: 'p1t2' },
					{ id: 3, name: 'p1t1' }
				],
				version: '1.2.0'
			}
		];

		const result = buildWorkflowTaskTableRows(taskGroups, 'pkg_name');
		expect(result[0].groupTitle).eq('p1');
		expect(result[1].groupTitle).eq('p2');
		expect(result[0].tasks).toHaveLength(2);
		expect(result[1].tasks).toHaveLength(1);
		expect(result[0].tasks[0].selectedVersion).eq('1.2.0');
		expect(result[0].tasks[0].taskVersions['1.2.0'].task_name).eq('p1t1');
		expect(result[0].tasks[1].selectedVersion).eq('1.2.0');
		expect(result[0].tasks[1].taskVersions['1.2.0'].task_name).eq('p1t2');
	});
});
