/**
 * Sort users by email.
 * @param {import('$lib/types').User} u1
 * @param {import('$lib/types').User} u2
 */
export const sortUserByEmailComparator = function (u1, u2) {
	return u1.email.localeCompare(u2.email, undefined, { sensitivity: 'base' });
};

/**
 * Sort groups by name.
 * @param {import('$lib/types').Group} g1
 * @param {import('$lib/types').Group} g2
 */
export const sortGroupByNameComparator = function (g1, g2) {
	return g1.name.localeCompare(g2.name, undefined, { sensitivity: 'base' });
};
