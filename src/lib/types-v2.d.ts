import type { JSONSchemaObjectProperty } from "fractal-jschema/types/jschema";
import { DatasetHistoryItem, type Task } from "./types";

export type ProjectV2 = {
  id: number
  name: string
  timestamp_created: string
}

export type DatasetV2 = {
  id: number
  name: string
  project_id: number
  project: ProjectV2
  history: Array<DatasetHistoryItemV2> | null
  zarr_dir: string
  filters: {
    attributes: { [key: string]: string | number | boolean }
    types: { [key: string]: boolean }
  },
  timestamp_created: string
}

export type DatasetHistoryItemV2 = {
  workflowtask: WorkflowTaskV2
  status: string
  parallelization: object
}

export type Image = {
  zarr_url: string
  attributes: { [key: string]: string | number | boolean }
  types: { [key: string]: boolean }
}

export type ImagePage = {
  total_count: number
  page_size: number
  current_page: number
  attributes: { [key: string]: Array<string | number | boolean> }
  types: Array<string>
  images: Array<Image>
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
  args_schema_version: 'pydantic_v1' | 'pydantic_v2'
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
  project: ProjectV2
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
  task_type: TaskV2Type
  input_filters: {
    attributes: { [key: string]: string | number | boolean }
    types: { [key: string]: boolean }
  }
  task_id: number
  task: TaskV2
}

type TaskV2Minimal = {
  id: number
  name: string
  type: string
  command_non_parallel: string | null
  command_parallel: string | null
  source: string
  source: string | null
  owner: string | null
  version: string | null
}

type TaskV2Relationship = {
  workflow_id: number
  workflow_name: string
  project_id: number
  project_name: string
  project_users: Array<{
    id: number
    email: string
  }> | null
}

export type TaskV2Info = {
  task: TaskV2Minimal,
  relationships: Array<TaskV2Relationship>
}
