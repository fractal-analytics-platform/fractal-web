import { it, expect } from 'vitest';
import {
	sortUsers,
	sortGroupByNameAllFirstComparator,
	sortUserToImportSettings
} from '$lib/components/admin/user_utilities';

it('should sort user by current superuser, then by superuser, then by email', () => {
	let users = [
		{ id: 5, is_superuser: false, email: 'user2@example.com' },
		{ id: 4, is_superuser: false, email: 'user1@example.com' },
		{ id: 3, is_superuser: true, email: 'admin2@example.com' },
		{ id: 2, is_superuser: true, email: 'admin1@example.com' },
		{ id: 1, is_superuser: true, email: 'current_admin@example.com' }
	];

	sortUsers(users, 1);

	expect(users[0].id).eq(1);
	expect(users[1].id).eq(2);
	expect(users[2].id).eq(3);
	expect(users[3].id).eq(4);
	expect(users[4].id).eq(5);

	users = [
		{ id: 1, is_superuser: true, email: 'admin@fractal.xy' },
		{ id: 2, is_superuser: true, email: 'zzz@fractal.xy' },
		{ id: 3, is_superuser: false, email: 'aaa@example.com' }
	];

	sortUsers(users, 2);

	expect(users[0].id).eq(2);
	expect(users[1].id).eq(1);
	expect(users[2].id).eq(3);
});

it('should sort groups by name, but keeping the All group first', () => {
	const groups = [
		{ id: 2, name: 'g2' },
		{ id: 1, name: 'All' },
		{ id: 3, name: 'g3' }
	];

	groups.sort(sortGroupByNameAllFirstComparator);

	expect(groups[0].name).eq('All');
	expect(groups[1].name).eq('g2');
	expect(groups[2].name).eq('g3');
});

it('should sort users to import settings', () => {
	const users = [
		{ id: 1, email: 'aaa@fractal.xy' }, // groups: 1
		{ id: 2, email: 'bbb@fractal.xy' }, // groups: 1, 2, 4
		{ id: 3, email: 'ccc@fractal.xy' }, // groups: 1, 3
		{ id: 4, email: 'ddd@fractal.xy' }  // groups: 1, 4
	];

	const desiredGroups = [2, 3];
	const allGroups = [
		{ id: 1, name: 'All', user_ids: [1, 2, 3, 4] },
		{ id: 2, name: 'g2', user_ids: [2] },
		{ id: 3, name: 'g3', user_ids: [3] },
		{ id: 4, name: 'g4', user_ids: [2, 4] }
	];

	const sortedUsers = sortUserToImportSettings(users, desiredGroups, allGroups);

	expect(sortedUsers[0].email).eq('ccc@fractal.xy');
	expect(sortedUsers[1].email).eq('bbb@fractal.xy');
	expect(sortedUsers[2].email).eq('aaa@fractal.xy');
	expect(sortedUsers[3].email).eq('ddd@fractal.xy');
});
