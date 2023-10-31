export const data = {
	projects: [
		{
			id: 1,
			name: 'project 1',
			dataset_list: [
				{ id: 1, name: 'input1', type: 'image' },
				{ id: 2, name: 'output1', type: 'zarr' }
			]
		},
		{
			id: 2,
			name: 'project 2',
			dataset_list: [
				{ id: 3, name: 'input2', type: 'image' },
				{ id: 4, name: 'output2', type: 'zarr' },
				{ id: 5, name: 'input3', type: 'image' },
				{ id: 6, name: 'output3', type: 'zarr' }
			]
		}
	],
	workflows: [
		{
			id: 1,
			name: 'workflow 1',
			project_id: 1,
			task_list: [
				{
					id: 1,
					workflow_id: 1,
					task_id: 1,
					task: {}
				}
			]
		},
		{
			id: 2,
			name: 'workflow 2',
			project_id: 2,
			task_list: [
				{
					id: 2,
					workflow_id: 2,
					task_id: 2,
					task: {}
				}
			]
		}
	],
	jobs: [
		{
			id: 1,
			project_id: 1,
			workflow_id: 1,
			input_dataset_id: 1,
			output_dataset_id: 2,
			start_timestamp: '2023-10-30T09:00:38.442196',
			end_timestamp: '2023-10-30T09:10:38.442196',
			status: 'done'
		},
		{
			id: 2,
			project_id: 2,
			workflow_id: 2,
			input_dataset_id: 3,
			output_dataset_id: 4,
			start_timestamp: '2023-10-30T09:15:38.442196',
			end_timestamp: '2023-10-30T09:20:38.442196',
			status: 'failed'
		},
		{
			id: 3,
			project_id: 2,
			workflow_id: 2,
			input_dataset_id: 5,
			output_dataset_id: 6,
			start_timestamp: '2023-10-30T09:30:38.442196',
			end_timestamp: null,
			status: 'running'
		}
	]
};
