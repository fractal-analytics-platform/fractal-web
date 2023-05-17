import { get } from 'svelte/store';
import { getProject, getWorkflows } from '$lib/api/v1/project/project_api';
import { contextProject } from '$lib/stores/projectStores';

export async function loadProjectContext(projectId) {
	const context = get(contextProject);

	// If the context is already loaded, do not reload it
	if (context.project !== undefined) {
		const currentProjectId = context.project.id;

		// If the project loaded is the same as the one we want to load, do not reload it
		if (currentProjectId === projectId) {
			return;
		}
	}

	await getProject(projectId)
		.then((project) => {
			contextProject.update((context) => {
				context.project = project;
				context.datasets = project.dataset_list;
				return context;
			});
		})
		.catch((error) => {
			console.error(error);
		});

	await getWorkflows(projectId)
		.then((workflows) => {
			contextProject.update((context) => {
				context.workflows = workflows;
				return context;
			});
		})
		.catch((error) => {
			console.error(error);
		});
}
