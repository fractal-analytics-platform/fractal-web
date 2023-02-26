export async function handle({ event, resolve }) {

  // Session handling
  const token = event.cookies.get('AccessToken')
  if (token !==  undefined) {
    const userData = await fetch('http://127.0.0.1:8000/auth/whoami', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
    })
      .then(response => {
        return response.json()
      })

    event.locals.user = userData
  }

  return resolve(event)
}