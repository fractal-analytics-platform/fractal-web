import { createServer } from 'http';

const PORT = process.env.PORT || 8080;

const server = createServer();

const tasksStatusMap = new Map();

server.on('request', (request, response) => {
	response.setHeader('Content-type', 'text/plain');

	if (!request.url) {
		return badRequest(response, 'unable to extract URL');
	}
	const url = new URL(request.url, `http://localhost:${PORT}`);

	if (request.method === 'GET') {
		// GET method is called by fake-task.sh
		const task = url.searchParams.get('task');
		if (!task) {
			return badRequest(response, 'missing task identifier');
		}
		const status = getTaskStatus(task);
		if (request.method === 'GET' && status !== 'submitted') {
			tasksStatusMap.delete(task);
		}
		response.end(status);
	} else {
		// PUT method is called by Playwright tests to update the desired task status
		if (url.pathname.startsWith('/done')) {
			setRunningTasksTo('done');
			response.end('done');
		} else if (url.pathname.startsWith('/failed')) {
			setRunningTasksTo('failed');
			response.end('failed');
		}
	}
});

function getTaskStatus(task) {
	if (!tasksStatusMap.has(task)) {
		console.log(`Creating entry for task ${task}`);
		// Set all the other running tasks to failed
		// If there are no flacky tests there shouldn't be other running tasks
		setRunningTasksTo('failed');
		// Add new task as submitted
		tasksStatusMap.set(task, 'submitted');
	}
	return tasksStatusMap.get(task);
}

/**
 * We handle only one running task, to simplify the fake server.
 * In case of flacky Playwright tests there could be more than one submitted task.
 * In that case we set all the submitted task to the same desired final value.
 * @param {string} status
 */
function setRunningTasksTo(status) {
	for (const [key, value] of tasksStatusMap.entries()) {
		if (value === 'submitted') {
			tasksStatusMap.set(key, status);
		}
	}
}

function badRequest(response, reason) {
	response.statusCode = 400;
	response.end(`Bad Request: ${reason}`);
}

server.listen(PORT, () => {
	console.log(`Starting fake job server at port ${PORT}`);
});
