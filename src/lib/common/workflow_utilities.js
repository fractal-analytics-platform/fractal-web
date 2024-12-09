/**
 * @param {Array<import("fractal-components/types/api").DatasetV2>} datasets
 * @param {Array<import("fractal-components/types/api").ApplyWorkflowV2>} jobs
 * @returns {number|undefined}
 */
export function getDefaultWorkflowDataset(datasets, jobs) {
	const jobsWithExistingDatasets = jobs.filter(j => j.dataset_id !== null);
	if (jobsWithExistingDatasets.length > 0) {
		return jobsWithExistingDatasets.sort((j1, j2) => (j1.start_timestamp > j2.start_timestamp ? -1 : 1))[0].dataset_id;
	}
	if (datasets.length > 0) {
		return datasets.sort((d1, d2) => (d1.timestamp_created > d2.timestamp_created ? -1 : 1))[0].id;
	}
	return undefined;
}

/**
 * @param {import("fractal-components/types/api").WorkflowV2} workflow
 * @param {Array<import("fractal-components/types/api").DatasetV2>} datasets
 * @param {number|undefined} defaultDatasetId
 * @returns {number|undefined}
 */
export function getSelectedWorkflowDataset(workflow, datasets, defaultDatasetId) {
	const selectedFromLocalStorage = getDatasetIdFromLocalStorage(workflow);
	if (selectedFromLocalStorage === undefined) {
		return defaultDatasetId;
	}
	const datasetExists = datasets.filter((d) => d.id === selectedFromLocalStorage).length > 0;
	if (datasetExists) {
		return selectedFromLocalStorage;
	}
	saveSelectedDataset(workflow, undefined);
	return defaultDatasetId;
}

const LOCAL_STORAGE_SELECTED_DATASETS = 'SelectedDatasets';

/**
 * @param {import("fractal-components/types/api").WorkflowV2} workflow
 * @param {number|undefined} datasetId
 */
export function saveSelectedDataset(workflow, datasetId) {
	let savedSelections = getDatasetSelectionsFromLocalStorage();
	const selection = savedSelections.filter(
		(s) => s.project_id === workflow.project_id && s.workflow_id === workflow.id
	);
	if (datasetId === undefined) {
		savedSelections = savedSelections.filter((s) => s.workflow_id !== workflow.id);
	} else if (selection.length > 0) {
		savedSelections = savedSelections.map((s) =>
			s.project_id === workflow.project_id && s.workflow_id === workflow.id
				? { ...s, dataset_id: datasetId }
				: s
		);
	} else {
		savedSelections.push({
			project_id: workflow.project_id,
			workflow_id: workflow.id,
			dataset_id: datasetId
		});
	}
	localStorage.setItem(LOCAL_STORAGE_SELECTED_DATASETS, JSON.stringify(savedSelections));
}

/**
 * @param {number} projectId
 */
export function deleteDatasetSelectionsForProject(projectId) {
	let savedSelections = getDatasetSelectionsFromLocalStorage();
	savedSelections = savedSelections.filter((s) => s.project_id !== projectId);
	localStorage.setItem(LOCAL_STORAGE_SELECTED_DATASETS, JSON.stringify(savedSelections));
}

/**
 * @param {import("fractal-components/types/api").WorkflowV2} workflow
 * @returns {number|undefined}
 */
function getDatasetIdFromLocalStorage(workflow) {
	const savedSelections = getDatasetSelectionsFromLocalStorage();
	const selection = savedSelections.filter(
		(s) => s.project_id === workflow.project_id && s.workflow_id === workflow.id
	);
	if (selection.length > 0) {
		return selection[0].dataset_id;
	}
	return undefined;
}

/**
 * @returns {Array<{project_id: number, workflow_id: number, dataset_id: number}>}
 */
function getDatasetSelectionsFromLocalStorage() {
	const storageContent = window.localStorage.getItem(LOCAL_STORAGE_SELECTED_DATASETS);
	if (storageContent) {
		try {
			const parsedValue = JSON.parse(storageContent);
			if (Array.isArray(parsedValue)) {
				return parsedValue;
			}
		} catch {
			console.error(`Invalid JSON inside localStorage item ${LOCAL_STORAGE_SELECTED_DATASETS}`);
		}
	}
	return [];
}
