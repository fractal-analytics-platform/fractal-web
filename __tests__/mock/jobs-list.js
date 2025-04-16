export const data = {
	userInfo: {
		email: 'admin@fractal.xy'
	},
	projects: [
		{
			id: 1,
			name: 'project 1'
		},
		{
			id: 2,
			name: 'project 2'
		}
	],
	inputDatasets: [
		{ id: 1, name: 'input1' },
		{ id: 3, name: 'input2' },
		{ id: 5, name: 'input3' }
	],
	outputDatasets: [
		{ id: 2, name: 'output1' },
		{ id: 4, name: 'output2' },
		{ id: 6, name: 'output3' }
	],
	workflows: [
		{
			id: 1,
			name: 'workflow 1'
		},
		{
			id: 2,
			name: 'workflow 2'
		}
	],
	jobs: /** @type {import('fractal-components/types/api').ApplyWorkflowV2[]} */ ([
		{
			id: 1,
			project_id: 1,
			workflow_id: 1,
			dataset_id: 1,
			dataset_dump: { id: 1, name: 'dataset1' },
			start_timestamp: '2023-10-30T09:00:38.442196+00:00',
			end_timestamp: '2023-10-30T09:10:38.442196+00:00',
			project_dump: { id: 1, name: 'project 1' },
			workflow_dump: { id: 1, name: 'workflow 1' },
			status: 'done',
			user_email: 'admin@fractal.xy'
		},
		{
			id: 2,
			project_id: 2,
			workflow_id: 2,
			dataset_id: 2,
			dataset_dump: { id: 2, name: 'dataset2' },
			start_timestamp: '2023-10-30T09:15:38.442196+00:00',
			end_timestamp: '2023-10-30T09:20:38.442196+00:00',
			project_dump: { id: 2, name: 'project 2' },
			workflow_dump: { id: 2, name: 'workflow 2' },
			status: 'failed',
			user_email: 'admin@fractal.xy'
		},
		{
			id: 3,
			project_id: 2,
			workflow_id: 2,
			dataset_id: 3,
			dataset_dump: { id: 3, name: 'dataset3' },
			start_timestamp: '2023-10-30T09:30:38.442196+00:00',
			project_dump: { id: 2, name: 'project 2' },
			workflow_dump: { id: 2, name: 'workflow 2' },
			end_timestamp: null,
			status: 'submitted',
			user_email: 'admin@fractal.xy'
		}
	])
};
