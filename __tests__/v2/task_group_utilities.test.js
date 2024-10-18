import { it, describe, expect } from 'vitest';
import {
	buildTaskTableRows,
	removeIdenticalTaskGroups
} from '$lib/components/v2/tasks/task_group_utilities.js';

describe('task_group_utilities', () => {
	it('buildTaskTableRows selects the latest version', async () => {
		const taskGroups = [
			{ id: 1, pkg_name: 'name', tasks: [], version: '1.0.0' },
			{ id: 2, pkg_name: 'name', tasks: [], version: '1.2.0' }
		];
		const result = buildTaskTableRows(taskGroups, 'pkg_name');
		expect(result[0].selectedVersion).eq('1.2.0');
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
});
