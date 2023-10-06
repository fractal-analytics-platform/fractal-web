export type GetHeaders = (originalHeaders: Headers | undefined) => Headers

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

export type WorkflowTask = {
  id: number
  meta: object
  args: object
  order: number
  workflow_id: number
  task_id: number
  task: Task
}