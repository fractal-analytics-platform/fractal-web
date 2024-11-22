export async function GET({ cookies }) {
	const cookie = cookies.get('fastapiusersauth');

	return new Response(cookie, {
		status: 200,
		headers: {
			'Content-Disposition': 'Attachment;filename=fractal-token.txt'
		}
	});
}
