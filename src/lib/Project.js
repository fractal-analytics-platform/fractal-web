import { env } from "$env/dynamic/public";

const PROJECT_API = env.PUBLIC_BACKEND_URL + "project/";


export async function ProjectCreate(payload) {
	const res = await fetch(
		PROJECT_API,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify(payload),
		}
	);
	let data = await res.json();
	if (res.status == 201) {
		return data;
	}
	else {
		throw({status: res.status, detail: data.detail});
	}
};


export async function ProjectList() {
	const res = await fetch(
		"http://127.0.0.1:8000/api/v1/project/",
		{credentials: "include"}
	);

	let data = await res.json();
	if (res.ok) {
		return data;
	}
	else {
		throw({status: res.status, detail: data.detail});
	}
};
