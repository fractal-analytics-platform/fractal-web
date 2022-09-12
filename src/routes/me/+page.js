import { ProjectList } from "$lib/Project.js";


export async function load() {
	try {
		return {projectList: await ProjectList()};
	}
	catch (e) {
		console.log(e);
		return {projectList: []};
	}
};
