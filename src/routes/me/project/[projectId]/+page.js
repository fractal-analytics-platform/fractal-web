import { ProjectGet } from "$lib/Project.js";
import { error } from "@sveltejs/kit";


export async function load({params}) {
	try {
		const project = await ProjectGet(params.projectId);
		return {project};
	}
	catch (e) {
		console.log(e);
		throw error(e.status, e.detail + " " + e.url);
	}
};
