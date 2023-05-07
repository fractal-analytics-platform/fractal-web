import { listTasks } from '$lib/server/api/v1/task_api'

export async function load({ fetch }) {

  let tasks = []
  try {
    tasks = await listTasks(fetch)
  } catch {
    console.error('The server was not able to fetch tasks')
  }


  return {
    tasks
  }

}