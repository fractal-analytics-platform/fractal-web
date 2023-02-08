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
//	{(console.log(res), '')}
	if (res.status == 201) {
		{(console.log(data), '')}
		return data;
	}
	else {
		throw({status: res.status, detail: data.detail});
	}
};


export async function ProjectGet(projectId) {
	const res = await fetch(
		PROJECT_API + projectId,
		{credentials: "include"}
	);

	let data = await res.json();
	if (res.ok) {
		return data;
	}
	else {
		throw({status: res.status, detail: data.detail, url: PROJECT_API + projectId});
	}
};


export async function ProjectList() {
	const res = await fetch(
		PROJECT_API,
		{credentials: "include"}
	);
	{(console.log(PROJECT_API), '')}

	let data = await res.json();
	if (res.ok) {
		return data;
	}
	else {
		throw({status: res.status, detail: data.detail});
	}
};


export async function ProjectDelete(project_id) {
	const res = await fetch(
		PROJECT_API + project_id,
		{
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		}
	);
	if (!res.ok) {
		throw({status: res.status, detail: await res.json()});
	}
}


export async function ProjectAddDataset(projectId, payload) {
	const res = await fetch(
		PROJECT_API + projectId + "/",
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
		return [data, res.status];
	}
	else {
		throw({status: res.status, detail: data.detail});
	}
}


export async function ProjectEditDataset(projectId, datasetId, payload) {
	const res = await fetch(
		PROJECT_API + projectId + "/" + datasetId ,
		{
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify(payload),
		}
	);
	let data = await res.json();
	if (res.status == 200) {
		return [data, res.status];
	}
	else {
		throw({status: res.status, detail: data.detail});
	}
}


export async function ResourceAdd(projectId, datasetId, payload) {
	const res = await fetch(
		PROJECT_API + projectId + "/" + datasetId,
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
}


export async function ResourceDelete(projectId, datasetId, resourceId) {
	const res = await fetch(
		PROJECT_API + projectId + "/" + datasetId + "/" + resourceId,
		{
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		}
		);
		if (!res.ok) {
			throw({status: res.status, detail: await res.json()});
		}
	}