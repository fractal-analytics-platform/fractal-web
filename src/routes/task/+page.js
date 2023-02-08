import { TaskList } from "$lib/Task.js"


export async function load() {
	try {
		return {taskList: await TaskList()};
	}
	catch (e) {
		console.log(e);
		return {taskList: []};
	}
};
