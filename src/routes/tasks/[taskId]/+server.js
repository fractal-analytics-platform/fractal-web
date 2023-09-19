import { editTask } from '$lib/server/api/v1/task_api';

export async function PATCH({ fetch, url, request }) {
	console.log('Edit task request');
	
	const parts = url.pathname.split('/');
	const taskId = parts[parts.length - 1];
	console.log('Task to edit: ' + taskId);

	const taskData = await request.json();

	return await editTask(fetch, taskId, taskData);
}
