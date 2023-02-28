import { PUBLIC_FRACTAL_SERVER_HOST } from '$env/static/public'

export async function list_tasks(fetch, cookies) {

	// Set headers
	const headers = new Headers()
	headers.append('Authorization', cookies.get('AccessToken'))

	// Compose request
	const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + '/api/v1/task/', {
		method: 'GET',
		headers: headers
	})
		// Handle response
		.then(response => {
			return response.json()
		})

	// The response should be of form ActionResult
	return response
}

export async function create_task(serverFetch, cookies, formData) {

	// Set headers
	const headers = new Headers()
	headers.append('Authorization', cookies.get('AccessToken'))
	headers.append('Content-Type', 'application/json')

	// Compose request
	// Since the api accepts application/json data format, we shall serialize data
	// into a json object. It is better to do this explicitly.
	const task_data = {
		name: formData.get('name'),
		command: formData.get('command'),
		source: formData.get('source'),
		input_type: formData.get('input_type'),
		output_type: formData.get('output_type')
	}
	// There is an interesting thing, if we use the svelte kit fetch object the server will not
	// accept our request. If, instead, we use the default javascript fetch the server accepts it.
	const actionResult = await fetch(PUBLIC_FRACTAL_SERVER_HOST + '/api/v1/task/', {
		method: 'POST',
		headers: headers,
		body: JSON.stringify(task_data)
	})
		.then(async response => {
			// Should check that the response is successful or not
			if (response.status !== 201) {
				return {
					createAction: {
						success: false,
						reason: await response.json()
					}
				}
			}
			return {
				createAction: {
					success: true
					// Additional data if necessary
				}
			}
		})

	return actionResult
}