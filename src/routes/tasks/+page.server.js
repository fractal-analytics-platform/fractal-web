import { fail } from '@sveltejs/kit';
import { listTasks, createTaskCollection } from '$lib/server/api/v1/task_api';

export async function load({ fetch }) {
	let tasks = [];
	try {
		tasks = await listTasks(fetch);
	} catch {
		console.error('The server was not able to fetch tasks');
	}

	return {
		tasks
	};
}

export const actions = {
	createTaskCollection: async ({ fetch, request }) => {
		console.log('Create task collection action');

		// Data to be sent to the server to request a task collection
		const formData = await request.formData();

		try {
			const taskCollection = await createTaskCollection(fetch, formData);
			if (taskCollection.status === 200) {
				console.log('Task collection already exists');
			} else {
				console.log('Task collection created', taskCollection);
			}
			return {
				taskCollection
			};
		} catch (error) {
			console.error(error);
			return fail(422, error.reason);
		}
	}
};
