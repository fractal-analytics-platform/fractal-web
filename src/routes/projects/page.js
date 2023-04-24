import { PUBLIC_FRACTAL_SERVER_HOST } from '$env/static/public'


export const load = async ({ fetch }) => {

    const listProjects2 = async () => {

        const response = await fetch(PUBLIC_FRACTAL_SERVER_HOST + '/api/v1/project', {
          method: 'GET',
          credentials: 'include'
        })

        console.log(response)
      
        if (response.ok) {
          console.error('BOH')
          return await response.json()
        }

        return []
      
        console.error('Client unable to fetch projects list')
        throw new Error('Unable to list projects')
      }

    return {
        listProjects: listProjects2(),
    }
}