/**
 * @param {Array<import('fractal-components/types/api').User & {id: number}>} users
 * @param {number} currentAdminId
 * @param {boolean|true=} prioritizeSuperusers
 */
export function sortUsers(users, currentAdminId, prioritizeSuperusers = true) {
	users.sort((a, b) => {
		// current admin is always first
		if (a.id === currentAdminId) {
			return -1;
		}
		if (b.id === currentAdminId) {
			return 1;
		}
		if (prioritizeSuperusers) {
			if (a.is_superuser && !b.is_superuser) {
				return -1;
			}
			if (!a.is_superuser && b.is_superuser) {
				return 1;
			}
		}
		// then sort by email
		return a.email.toLocaleLowerCase() < b.email.toLocaleLowerCase() ? -1 : 1;
	});
	return users;
}

/**
 * Sort groups by name, but keeping the All group first.
 * @param {import('fractal-components/types/api').Group} g1
 * @param {import('fractal-components/types/api').Group} g2
 */
export const sortGroupByNameAllFirstComparator = function (g1, g2) {
	return g1.name === 'All'
		? -1
		: g2.name === 'All'
		? 1
		: g1.name.localeCompare(g2.name, undefined, { sensitivity: 'base' });
};

/**
 * @param {Array<import('fractal-components/types/api').User & {id: number}>} users
 * @param {number[]} desiredGroups
 * @param {Array<import('fractal-components/types/api').Group & {user_ids: number[]}>} allGroups
 * @returns
 */
export const sortUserToImportSettings = function (users, desiredGroups, allGroups) {
	users.sort((u1, u2) => {
		const u1Groups = allGroups.filter((g) => g.user_ids.includes(u1.id)).map((g) => g.id);
		const u2Groups = allGroups.filter((g) => g.user_ids.includes(u2.id)).map((g) => g.id);
		for (const u1g of u1Groups) {
			if (desiredGroups.includes(u1g)) {
				return -1;
			}
		}
		for (const u2g of u2Groups) {
			if (desiredGroups.includes(u2g)) {
				return 1;
			}
		}
		return 0;
	});
	return users;
};

/**
 * @param {import('fractal-components/types/api').User[]} users
 * @param {number} currentUserId
 */
export function sortDropdownUsers(users, currentUserId) {
	const usersCopy = /** @type {Array<import('fractal-components/types/api').User & {id: number}>} */ ([...users]);
	sortUsers(usersCopy, currentUserId, false);
	return usersCopy;
}
