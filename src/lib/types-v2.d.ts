import { Project, DatasetHistoryItem } from "./types";

export type DatasetV2 = {
  id: number
  name: string
  project_id: number
  project: Project
  history: Array<DatasetHistoryItem> | null
  read_only: boolean
  zarr_dir: string
  filters: {
    [key: string]: string | number | boolean
  }
  timestamp_created: string
}
