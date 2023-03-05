import { list_tasks, create_task, create_task_collection } from '$lib/api/v1/task/task_api'

export async function load({ fetch, cookies}) {
  return {
    tasks: list_tasks(fetch, cookies)
  }
}

export const actions = {

  create: async ({ fetch, cookies, request }) => {
    const formData = await request.formData()
    return create_task(fetch, cookies, formData)
  },

  collectTask: async({ fetch, cookies, request }) => {
    const formData = await request.formData()
    return {
      collectTaskAction: await create_task_collection(fetch, cookies, formData)
    }
  }

}