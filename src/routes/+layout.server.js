// Application configuration to run as a SPA
export const ssr = false

export async function load({ locals }) {
	return {
		user: locals.user,
	}
}