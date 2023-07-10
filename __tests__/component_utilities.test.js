import { it, expect } from 'vitest';
import { orderTasksByOwnerThenByNameThenByVersion } from '$lib/common/component_utilities.js';

it('should order tasks by owner, then by name, then by version', () => {
	const tasks = [
		{ name: 'task1', owner: 'owner1', version: '0.0.1' },
		{ name: 'task2', owner: 'owner1', version: '0.0.1' },
		{ name: 'task3', owner: 'owner1', version: '0.0.2' },
		{ name: 'task4', owner: 'owner2', version: '0.0.1' },
		{ name: 'task5', owner: 'owner2', version: '0.0.2' },
		{ name: 'task6', owner: 'owner2', version: '0.0.2' },
		{ name: 'task7', owner: 'admin', version: '0.0.1' },
		{ name: 'task8', owner: 'owner3', version: '0.0.2' },
		{ name: 'task9', owner: 'owner3', version: '0.0.2' }
	];

	const sortedTasks = orderTasksByOwnerThenByNameThenByVersion(tasks);

	expect(sortedTasks).toEqual([
		{ name: 'task7', owner: 'admin', version: '0.0.1' },
		{ name: 'task1', owner: 'owner1', version: '0.0.1' },
		{ name: 'task2', owner: 'owner1', version: '0.0.1' },
		{ name: 'task3', owner: 'owner1', version: '0.0.2' },
		{ name: 'task4', owner: 'owner2', version: '0.0.1' },
		{ name: 'task5', owner: 'owner2', version: '0.0.2' },
		{ name: 'task6', owner: 'owner2', version: '0.0.2' },
		{ name: 'task8', owner: 'owner3', version: '0.0.2' },
		{ name: 'task9', owner: 'owner3', version: '0.0.2' }
	]);

	const sortedTasks2 = orderTasksByOwnerThenByNameThenByVersion(tasks, 'owner2');

	expect(sortedTasks2).toEqual([
		{ name: 'task4', owner: 'owner2', version: '0.0.1' },
		{ name: 'task5', owner: 'owner2', version: '0.0.2' },
		{ name: 'task6', owner: 'owner2', version: '0.0.2' },
		{ name: 'task7', owner: 'admin', version: '0.0.1' },
		{ name: 'task1', owner: 'owner1', version: '0.0.1' },
		{ name: 'task2', owner: 'owner1', version: '0.0.1' },
		{ name: 'task3', owner: 'owner1', version: '0.0.2' },
		{ name: 'task8', owner: 'owner3', version: '0.0.2' },
		{ name: 'task9', owner: 'owner3', version: '0.0.2' }
	]);
});
