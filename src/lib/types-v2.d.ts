import type { JSONSchemaObjectProperty } from "./components/common/jschema/jschema-types";
import { Project, DatasetHistoryItem, type Task } from "./types";

export type DatasetV2 = {
  id: number
  name: string
  project_id: number
  project: Project
  history: Array<DatasetHistoryItem> | null
  read_only: boolean
  zarr_dir: string
  filters: {
    attributes: { [key: string]: string | number },
    types: { [key: string]: boolean }
  },
  timestamp_created: string
}

export type ImagePage = {
  total_count: number
  page_size: number
  current_page: number
  attributes: { [key: string]: Array<string | number> }
  types: Array<string>
  images: Array<{
    path: string
    attributes: { [key: string]: string }
    types: { [key: string]: boolean }
  }>
}

export type TaskV2Type = 'non_parallel' | 'parallel' | 'compound'

export type TaskV2 = {
  id: number
  name: string
  type: TaskV2Type
  command_non_parallel: string | null
  command_parallel: string | null
  input_types: { [key: string]: boolean }
  output_types: { [key: string]: boolean }
  version: string | null
  owner: string
  source: string
  args_schema_version: string
  args_schema_non_parallel: JSONSchemaObjectProperty | null
  args_schema_parallel: JSONSchemaObjectProperty | null
  docs_link: string
  docs_info: string
  meta_non_parallel: object
  meta_parallel: object
}

export type ApplyWorkflowV2 = {
  id: number
  project_id: number
  workflow_id: number
  dataset_id: number
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
  dataset_dump: {
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

export type WorkflowV2 = {
  id: number
  name: string
  project_id: number
  project: Project
  task_list: Array<WorkflowTaskV2>
  timestamp_created: string
}

export type WorkflowTaskV2 = {
  id: number
  meta_non_parallel: object
  meta_parallel: object
  args_non_parallel: object
  args_parallel: object
  order: number
  workflow_id: number
  task_id: number
  task: TaskV2
  is_legacy_task: boolean
  task_legacy_id: number
  task_legacy: Task
}
