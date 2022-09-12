export async function load() {
	const res = await fetch(
		"http://127.0.0.1:8000/api/v1/project/",
		{credentials: "include"}
	);

	if (res.ok) {
		return {projectList: await res.json()};
	}
	return {
		projects: []
	};
};
