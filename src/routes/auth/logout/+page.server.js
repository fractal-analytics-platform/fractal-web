export async function load({ cookies }) {
	cookies.delete('AccessToken', { path: '/' })
}