export async function load({ fetch }) {
	const res = await fetch(
		"http://127.0.0.1:8000/api/v1/project/",
		{credentials: "include"}
	);

	if (res.ok) {
		return {projects: await res.json()};
	}
	return {
		projects: []
	};
};
