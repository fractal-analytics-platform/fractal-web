import { it, expect } from 'vitest';
import { sortUsers } from '$lib/components/admin/user_utilities';

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
