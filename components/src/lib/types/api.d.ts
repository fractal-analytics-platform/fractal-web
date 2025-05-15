import type { JSONSchemaObjectProperty } from './jschema';

export type GetHeaders = (originalHeaders: Headers | undefined) => Headers;

export type User = {
	id?: number;
	email: string;
	is_active: boolean;
	is_superuser: boolean;
	is_verified: boolean;
	username: string | null;
	password?: string;
	group_ids_names: Array<[number, string]> | null;
	oauth_accounts: Array<{
		id: number;
		account_email: string;
		oauth_name: string;
	}>;
};

export type UserSettings = {
	slurm_accounts: string[];
	project_dir: string | null;
	// Slurm
	slurm_user: string | null;
	// Slurm SSH
	ssh_host: string | null;
	ssh_username: string | null;
	ssh_private_key_path: string | null;
	ssh_tasks_dir: string | null;
	ssh_jobs_dir: string | null;
};

export type Group = {
	id: number;
	name: string;
	timestamp_created: string;
	user_ids?: number[];
	viewer_paths: string[];
};

export type DatasetHistoryItem = {
	workflowtask: WorkflowTask;
	status: string;
	parallelization: object;
};

export type ProjectV2 = {
	id: number;
	name: string;
	timestamp_created: string;
};

export type DatasetV2 = {
	id: number;
	name: string;
	project_id: number;
	project: ProjectV2;
	history: Array<DatasetHistoryItemV2> | null;
	zarr_dir: string;
	timestamp_created: string;
};

export type DatasetHistoryItemV2 = {
	workflowtask: WorkflowTaskV2;
	status: string;
	parallelization: object;
};

export type Image = {
	zarr_url: string;
	attributes: { [key: string]: string | number | boolean };
	types: { [key: string]: boolean };
	status?: string;
};

export type Pagination<T> = {
	total_count: number;
	page_size: number;
	current_page: number;
	items: Array<T>;
};

export type ImagePage = Pagination<Image> & {
	attributes: { [key: string]: Array<string | number | boolean> };
	types: Array<string>;
};

export type TaskV2Type =
	| 'non_parallel'
	| 'parallel'
	| 'compound'
	| 'converter_non_parallel'
	| 'converter_compound';

export type TaskV2 = {
	id: number;
	name: string;
	version: string;
	type: TaskV2Type;
	command_non_parallel: string | null;
	command_parallel: string | null;
	input_types: { [key: string]: boolean };
	output_types: { [key: string]: boolean };
	taskgroupv2_id: number;
	source: string;
	args_schema_version: 'pydantic_v1' | 'pydantic_v2';
	args_schema_non_parallel: JSONSchemaObjectProperty | null;
	args_schema_parallel: JSONSchemaObjectProperty | null;
	docs_link: string;
	docs_info: string;
	meta_non_parallel: object;
	meta_parallel: object;
	category: string | null;
	modality: string | null;
	authors: string | null;
	tags: string[];
	install_instructions: string | undefined;
};

export type ApplyWorkflowV2 = {
	id: number;
	project_id: number;
	workflow_id: number;
	dataset_id: number;
	worker_init: string | null;
	start_timestamp: string;
	end_timestamp: string | null;
	status: JobStatus;
	log: string | null;
	project_dump: {
		id: number;
		name: string;
	};
	workflow_dump: {
		id: number;
		name: string;
	};
	dataset_dump: {
		id: number;
		name: string;
	};
	working_dir: string | null;
	working_dir_user: string | null;
	first_task_index: number | null;
	last_task_index: number | null;
	user_email: string;
	slurm_account: string | null;
	attribute_filters: { [key: string]: string | number | boolean };
};

export type JobStatus = 'submitted' | 'done' | 'failed';

export type ImagesStatus = {
	status: JobStatus | 'partial';
	num_submitted_images: number;
	num_done_images: number;
	num_failed_images: number;
	num_available_images: number | null;
};

export type WorkflowV2 = {
	id: number;
	name: string;
	project_id: number;
	project: ProjectV2;
	task_list: Array<WorkflowTaskV2>;
	timestamp_created: string;
};

export type WorkflowTaskV2 = {
	id: number;
	meta_non_parallel: object;
	meta_parallel: object;
	args_non_parallel: object;
	args_parallel: object;
	order: number;
	workflow_id: number;
	task_type: TaskV2Type;
	type_filters: { [key: string]: boolean };
	task_id: number;
	task: TaskV2;
	warning: string | null;
};

type TaskV2Minimal = {
	id: number;
	name: string;
	type: string;
	command_non_parallel: string | null;
	command_parallel: string | null;
	source: string | null;
	version: string | null;
};

type TaskV2Relationship = {
	workflow_id: number;
	workflow_name: string;
	project_id: number;
	project_name: string;
	project_users: Array<{
		id: number;
		email: string;
	}> | null;
};

export type TaskV2Info = {
	task: TaskV2Minimal;
	relationships: Array<TaskV2Relationship>;
};

export type TaskGroupV2 = {
	id: number;
	task_list: TaskV2[];
	user_id: number;
	user_group_id: number;
	origin: string;
	pkg_name: string;
	version: string | null;
	python_version: string;
	path: string;
	venv_path: string;
	venv_file_number: number;
	venv_size_in_kB: number;
	pip_extras: string;
	active: boolean;
	timestamp_created: string;
	timestamp_last_used: string;
};

export type WorkflowTasksTableRowGroup = {
	groupTitle: string;
	tasks: Array<{
		selectedVersion: string;
		taskVersions: {
			[version: string]: TasksTableRow;
		};
	}>;
};

export type TasksTableRowGroup = {
	groupTitle: string;
	selectedVersion: string;
	groups: { [version: string]: TaskGroupV2 };
};

export type TasksTableRow = {
	pkg_name: string;
	task_id: number;
	task_name: string;
	version: string;
	category: string | null;
	modality: string | null;
	authors: string | null;
	tags: string[];
	input_types: { [key: string]: boolean };
	docs_info: string;
	docs_link: string | null;
	install_instructions: string | undefined;
};

export type TaskGroupActivityStatusV2 = 'pending' | 'ongoing' | 'failed' | 'OK';

export type TaskGroupActivityActionV2 = 'collect' | 'deactivate' | 'reactivate';

export type TaskGroupActivityV2 = {
	id: number;
	user_id: number;
	taskgroupv2_id: number | null;
	timestamp_started: string;
	timestamp_ended: string | null;
	pkg_name: string;
	version: string;
	status: TaskGroupActivityStatusV2;
	action: TaskGroupActivityActionV2;
	log: string | null;
};

export type TypeFiltersFlow = {
	workflowtask_id: number;
	current_type_filters: { [key: string]: bool };
	input_type_filters: { [key: string]: bool };
	output_type_filters: { [key: string]: bool };
};

export type Accounting = Pagination<{
	id: number;
	user_id: number;
	timestamp: string;
	num_tasks: number;
	num_new_images: number;
}>;

export type HistoryItemV2 = {
	id: number;
	dataset_id: number;
	workflowtask_id: number;
	workflowtask_dump: WorkflowTaskV2;
	task_group_dump: TaskGroupV2;
	timestamp_started: string;
	status: ImagesStatus;
	num_available_images: number;
};

export type HistoryUnit = {
	id: number;
	status: JobStatus;
	zarr_urls: string[];
	logfile: string | null;
};

export type HistoryRunAggregated = {
	id: number;
	workflowtask_dump: WorkflowTaskV2;
	num_submitted_units: number;
	num_done_units: number;
	num_failed_units: number;
	args_schema_parallel: JSONSchemaObjectProperty | null;
	args_schema_non_parallel: JSONSchemaObjectProperty | null;
};
