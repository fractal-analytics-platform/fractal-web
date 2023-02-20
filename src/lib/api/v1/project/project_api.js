export async function list_projects() {
	return [
		{ id: 1, name: 'Test 1', project_dir: '/dir/project/1', dataset_list: [], readonly: false },
		{ id: 2, name: 'Test 2', project_dir: '/dir/project/2', dataset_list: [], readonly: false }
	]
}