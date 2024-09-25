export type GetHeaders = (originalHeaders: Headers | undefined) => Headers

export type Project = {
  id: number
  name: string
  read_only: boolean
  timestamp_created: string
}

export type Task = {
  id: number
  name: string
  command: string
  input_type: string
  output_type: string
  version: string
  owner: string
  source: string
  args_schema_version: 'pydantic_v1'
  args_schema: JSONSchemaObjectProperty | null
  docs_link: string
  docs_info: string
  meta: object
}

export type Workflow = {
  id: number
  name: string
  project_id: number
  project: Project
  task_list: Array<WorkflowTask>
  timestamp_created: string
}

export type WorkflowTask = {
  id: number
  meta: object
  args: object
  order: number
  workflow_id: number
  task_id: number
  task: Task
}

export type Resource = {
  path: string
  id: number
  dataset_id: number
}

export type DatasetHistoryItem = {
  workflowtask: WorkflowTask
  status: string
  parallelization: object
}

export type Dataset = {
  name: string
  type?: string
  meta: object
  history: Array<DatasetHistoryItem> | null
  read_only: boolean
  id: number
  resource_list: Array<Resource>
  project_id: number
  project: Project
  timestamp_created: string
}

export type JobStatus = 'submitted' | 'done' | 'failed'

export type ApplyWorkflow = {
  id: number
  project_id: number
  workflow_id: number
  input_dataset_id: number
  output_dataset_id: number
  worker_init: string | null
  start_timestamp: string
  end_timestamp: string | null
  status: JobStatus
  log: string | null
  project_dump: {
    id: number
    name: string
  },
  workflow_dump: {
    id: number
    name: string
  }
  output_dataset_dump: {
    id: number
    name: string
  }
  input_dataset_dump: {
    id: number
    name: string
  }
  working_dir: string | null
  working_dir_user: string | null
  first_task_index: number | null
  last_task_index: number | null
  user_email: string
  slurm_account: string | null
}

export type User = {
  id?: number
  email: string
  is_active: boolean
  is_superuser: boolean
  is_verified: boolean
  username: string | null
  password?: string
  group_names?: string[]
  group_ids?: number[]
  oauth_accounts: Array<{
    id: number
    account_email: string
    oauth_name: string
  }>
}

export type UserSettings = {
  cache_dir: string | null
  slurm_accounts: string[]
  // Slurm
  slurm_user: string | null
  // Slurm SSH
  ssh_host: string | null
  ssh_username: string | null
  ssh_private_key_path: string | null
  ssh_tasks_dir: string | null
  ssh_jobs_dir: string | null
  slurm_accounts: string | null
}

export type Group = {
  id: number
  name: string
  timestamp_created: string
  user_ids?: number[]
}

export type TaskCollectStatus = 'pending' | 'installing' | 'collecting' | 'fail' | 'OK';

export type TasksCollections = {
  id: number
  package_version: string
  pkg: string
  status: TaskCollectStatus
  timestamp: string
  logs?: string
}

export type TasksCollectionsStateData = {
  package: string
  package_version: string
  status: TaskCollectStatus
  logs?: string
  info?: string
}

export type TasksCollectionsState = {
  id: number
  data: TasksCollectionsStateData
  timestamp: string
}
