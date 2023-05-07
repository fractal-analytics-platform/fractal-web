import { fail } from '@sveltejs/kit'
import { listTasks, createTask } from '$lib/server/api/v1/task_api'

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

export const actions = {

  createTask: async ({ fetch, request }) => {
    console.log('Create task action')

    const formData = await request.formData()

    try {
      const task = await createTask(fetch, formData)
      console.log('Task created', task)
      return {
        task
      }
    } catch (error) {
      console.error(error)
      return fail(422, error.reason)
    }
  }

}