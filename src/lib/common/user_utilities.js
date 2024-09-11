/**
 * Sort users by email.
 * @param {import('$lib/types').User} u1
 * @param {import('$lib/types').User} u2
 */
export const sortUserByEmailComparator = function (u1, u2) {
	return u1.email.localeCompare(u2.email, undefined, { sensitivity: 'base' });
};
