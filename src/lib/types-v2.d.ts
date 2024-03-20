import { Project, DatasetHistoryItem } from "./types";

export type DatasetV2 = {
  id: number
  name: string
  project_id: number
  project: Project
  history: Array<DatasetHistoryItem> | null
  read_only: boolean
  zarr_dir: string
  attribute_filters: { [key: string]: string | number }
  flag_filters: { [key: string]: boolean }
  timestamp_created: string
}

export type ImagePage = {
  total_count: number
  page_size: number
  current_page: number
  attributes: { [key: string]: Array<string | number> }
  flags: Array<string>
  images: Array<{
    path: string
    attributes: { [key: string]: string }
    flags: { [key: string]: boolean }
  }>
}
