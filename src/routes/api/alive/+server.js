// This fetch logs to terminal console

import { json } from '@sveltejs/kit';

export async function GET() {
  console.log("CIAO SONO IOOOOOOOOOOO")
    const info = await fetch('http://localhost:8000/api/alive/', {
    method: 'GET'
  })
    .then(async (response) => {
      return await response.json()
    })

    return json(info)
}