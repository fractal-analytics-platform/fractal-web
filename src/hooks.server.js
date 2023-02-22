export async function handle({ event, resolve }) {

  // Session handling
  const token = event.cookies.get('AccessToken')

  if (token !==  undefined) {
    fetch('http://127.0.0.1:8000/auth/whoami', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
    })
      .then(response => {
        console.log('HANDLER', response.status)
        response.json().then(data => console.log(data))
      })
  }

  return resolve(event)
}