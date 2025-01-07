import { createServer } from 'http';

const PORT = process.env.PORT || 8080;

const server = createServer();

/** @type {Map<number, string>} */
const jobsStatusMap = new Map();

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
		const { jobId } = extractJobInfo(task);
		const status = getJobStatus(jobId);
		if (request.method === 'GET' && status !== 'submitted') {
			console.log(`Removing job ${jobId}`);
			jobsStatusMap.delete(jobId);
		}
		response.end(status);
	} else {
		// PUT method is called by Playwright tests to update the desired task status
		const match = url.pathname.match(/\/v2\/(\d+)/);
		if (!match) {
			return badRequest(response, `missing job identifier in ${url.pathname}`);
		}
		const jobId = Number(match[1]);
		const status = url.searchParams.get('status');
		if (!status) {
			return badRequest(response, 'missing status');
		}
		console.log(`Setting job ${jobId} status to ${status}`);
		jobsStatusMap.set(Number(jobId), status);
		response.end(status);
	}
});

/**
 * @param {string} taskFolder
 */
function extractJobInfo(taskFolder) {
	const match = taskFolder.match(/job_(\d+)/);
	if (!match) {
		throw new Error(`Unable to extract job id from ${taskFolder}`);
	}
	return { jobId: Number(match[1]) };
}

/**
 * @param {number} jobId
 * @returns {string|undefined}
 */
function getJobStatus(jobId) {
	if (!jobsStatusMap.has(jobId)) {
		console.log(`Creating entry for job ${jobId}`);
		jobsStatusMap.set(jobId, 'submitted');
	}
	return jobsStatusMap.get(jobId);
}

function badRequest(response, reason) {
	response.statusCode = 400;
	response.end(`Bad Request: ${reason}`);
}

server.listen(PORT, () => {
	console.log(`Starting fake job server at port ${PORT}`);
});
