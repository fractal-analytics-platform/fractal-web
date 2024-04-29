import { describe, it, expect } from 'vitest';
import {
	deleteDatasetSelectionsForProject,
	getDefaultWorkflowDataset,
	getSelectedWorkflowDataset,
	saveSelectedDataset
} from '$lib/common/workflow_utilities.js';

describe('Workflow Utilities', () => {
	it('Default dataset is taken from most recent job', () => {
		const id = getDefaultWorkflowDataset(
			[],
			[
				{ start_timestamp: '2024-04-24T10:18:37.868655+00:00', dataset_id: 1 },
				{ start_timestamp: '2024-04-24T15:18:37.868655+00:00', dataset_id: 2 }
			]
		);
		expect(id).toEqual(2);
	});

	it('Default dataset is taken from most recent dataset', () => {
		const id = getDefaultWorkflowDataset(
			[
				{ id: 1, timestamp_created: '2024-04-24T10:18:37.868655+00:00' },
				{ id: 2, timestamp_created: '2024-04-24T15:18:37.868655+00:00' }
			],
			[]
		);
		expect(id).toEqual(2);
	});

	it('Default dataset is undefined if there are no jobs and no datasets', () => {
		const id = getDefaultWorkflowDataset([], []);
		expect(id).toEqual(undefined);
	});

	it('Store and retrieve selected dataset from localStorage', () => {
		const workflow1 = { id: 1, project_id: 1 };
		const workflow2 = { id: 2, project_id: 1 };
		const datasets = [{ id: 1 }, { id: 2 }, { id: 3 }];
		let datasetId = getSelectedWorkflowDataset(workflow1, datasets, 3);
		// return default dataset if nothing is stored in localStorage
		expect(datasetId).toEqual(3);

		saveSelectedDataset(workflow1, 2);
		datasetId = getSelectedWorkflowDataset(workflow1, datasets, 3);
		// return dataset saved in localStorage
		expect(datasetId).toEqual(2);

		saveSelectedDataset(workflow1, 4); // dataset doesn't exist
		datasetId = getSelectedWorkflowDataset(workflow1, datasets, 3);
		// return default dataset if the dataset stored in localstorage doesn't exist
		expect(datasetId).toEqual(3);

		saveSelectedDataset(workflow1, 1); // replace stored selection
		datasetId = getSelectedWorkflowDataset(workflow1, datasets, 3);
		// return dataset saved in localStorage
		expect(datasetId).toEqual(1);

		saveSelectedDataset(workflow2, 2); // add new selection
		datasetId = getSelectedWorkflowDataset(workflow2, datasets, 3);
		// return dataset saved in localStorage
		expect(datasetId).toEqual(2);

		saveSelectedDataset(workflow1, undefined); // remove stored value
		datasetId = getSelectedWorkflowDataset(workflow1, datasets, 3);
		// return default dataset
		expect(datasetId).toEqual(3);

		deleteDatasetSelectionsForProject(1); // remove all selections for the project
		datasetId = getSelectedWorkflowDataset(workflow2, datasets, 3);
		// return default dataset
		expect(datasetId).toEqual(3);
	});
});
