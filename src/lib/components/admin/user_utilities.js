/**
 * @param {Array<import('$lib/types').User & {id: number}>} users
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
		return a.email < b.email ? -1 : 1;
	});
	return users;
}
