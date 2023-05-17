import { listTasks } from '$lib/server/api/v1/task_api';

export async function GET({ fetch }) {
	console.log('GET list of tasks');

	try {
		const tasks = await listTasks(fetch);
		return new Response(JSON.stringify(tasks), { status: 200 });
	} catch (error) {
		console.error('Error listing tasks', error);
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}
