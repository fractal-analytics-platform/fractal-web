export async function GET({ cookies }) {
	const cookie = cookies.get('fastapiusersauth');

	return new Response(JSON.stringify({ token: cookie }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	});
}
