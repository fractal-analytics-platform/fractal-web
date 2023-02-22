import { PUBLIC_FRACTAL_SERVER_HOST } from '$env/static/public'
export const actions = {
	default: async ({ request, fetch, cookies }) => {

		let requestUrl = PUBLIC_FRACTAL_SERVER_HOST + '/auth/token/login'

		const requestForm = await request.formData()

		const loginResponse = await fetch(requestUrl, {
			method: 'POST',
			credentials: 'include',
			body: requestForm
		})

		let status = loginResponse.status

		if (status !== 200) {
			throw new Error('Error login')
		}

		await loginResponse
			.json()
			.then((data) => {
				cookies.set('AccessToken', 'Bearer ' + data['access_token'], {
					path: '/',
					secure: true,
					httpOnly: true,
					maxAge: 86400
				})
			})
	}
}