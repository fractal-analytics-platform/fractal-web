export type GetHeaders = (originalHeaders: Headers | undefined) => Headers

export type Project = {
  id: number
  name: string
  read_only: boolean
  dataset_list: Array<Dataset>
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
  args_schema_version: string
  args_schema: object
  docs_link: string
  docs_info: string
  meta: object
}

export type Workflow = {
  id: number
  name: string
  project_id: number
  task_list: Array<WorkflowTask>
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
  history: Array<DatasetHistoryItem>
  read_only: boolean
  id: number
  resource_list: Array<Resource>
  project_id: number
}

export type JobStatus = 'submitted' | 'running' | 'done' | 'failed'

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
  workflow_dump: {
    id: number
    name: string
  } | null
  working_dir: string | null
  working_dir_user: string | null
  first_task_index: number | null
  last_task_index: number | null
}
