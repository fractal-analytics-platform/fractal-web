/**
 * Sort users by email.
 * @param {import('fractal-components/types/api').User} u1
 * @param {import('fractal-components/types/api').User} u2
 */
export const sortUserByEmailComparator = function (u1, u2) {
	return u1.email.localeCompare(u2.email, undefined, { sensitivity: 'base' });
};
