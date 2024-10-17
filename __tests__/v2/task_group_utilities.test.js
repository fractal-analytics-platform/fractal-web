import { it, describe, expect } from 'vitest';
import { buildTaskTableRows } from '$lib/components/v2/tasks/task_group_utilities.js';

describe('task_group_utilities', () => {
	it('buildTaskTableRows selects the latest version', async () => {
		const taskGroups = [
			{ id: 1, pkg_name: 'name', tasks: [], version: '1.0.0' },
			{ id: 2, pkg_name: 'name', tasks: [], version: '1.2.0' }
		];
		const result = buildTaskTableRows(taskGroups, 'pkg_name');
		expect(result[0].selectedVersion).eq('1.2.0');
	});
});
