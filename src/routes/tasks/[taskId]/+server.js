import { deleteTask } from '$lib/server/api/v1/task_api';

export async function DELETE({ fetch, url }) {
	console.log('Delete task request');

	const parts = url.pathname.split('/');
	const taskId = parts[parts.length - 1];
	console.log('Task to delete: ' + taskId);

	return await deleteTask(fetch, taskId);
}
