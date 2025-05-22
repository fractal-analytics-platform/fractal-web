import { it, describe, expect } from 'vitest';
import {
	buildTaskTableRows,
	buildWorkflowTaskTableRows
} from '../../src/lib/tasks/task_group_utilities.js';

describe('task_group_utilities', () => {
	it('buildTaskTableRows', async () => {
		const taskGroups = [
			[
				'name',
				[
					{ id: 2, pkg_name: 'name', task_list: [{ id: 3 }, { id: 4 }], version: '1.2.0' },
					{ id: 1, pkg_name: 'name', task_list: [{ id: 2 }, { id: 1 }], version: '1.0.0' }
				]
			]
		];
		const result = buildTaskTableRows(taskGroups, 'pkg_name');
		// selects the latest version
		expect(result[0].selectedVersion).eq('1.2.0');
		// 1.2.1 should be ignored since it is empty
		expect(Object.keys(result[0].groups)).toHaveLength(2);
		expect(result[0].groups[0].id).eq(2);
		expect(result[0].groups[1].id).eq(1);
	});

	it('buildWorkflowTaskTableRows groups by pkg_name', async () => {
		const taskGroups = [
			[
				'p1',
				[
					{
						id: 2,
						pkg_name: 'p1',
						task_list: [
							{ id: 3, name: 'p1t1' },
							{ id: 4, name: 'p1t2' }
						],
						version: '1.2.0'
					},
					{
						id: 1,
						pkg_name: 'p1',
						task_list: [
							{ id: 1, name: 'p1t1' },
							{ id: 2, name: 'p1t2' }
						],
						version: '1.0.0'
					}
				]
			],
			['p2', [{ id: 3, pkg_name: 'p2', task_list: [{ id: 6 }, { id: 5 }], version: '3.0.0' }]]
		];

		const result = buildWorkflowTaskTableRows(taskGroups);
		expect(result[0].pkg_name).eq('p1');
		expect(result[1].pkg_name).eq('p2');
		expect(result[0].tasks).toHaveLength(2);
		expect(result[1].tasks).toHaveLength(1);
		expect(result[0].tasks[0].selectedVersion).eq('1.2.0');
		expect(result[0].tasks[0].taskVersions[0].task_name).eq('p1t1');
		expect(result[0].tasks[0].taskVersions[1].task_name).eq('p1t1');
		expect(result[0].tasks[1].selectedVersion).eq('1.2.0');
		expect(result[0].tasks[1].taskVersions[0].task_name).eq('p1t2');
		expect(result[0].tasks[1].taskVersions[1].task_name).eq('p1t2');
	});
});
