import { env } from "$env/dynamic/public";

const TASK_API = env.PUBLIC_BACKEND_URL + "task/";


export async function TaskCreate(payload) {

	const res = await fetch(
		TASK_API,
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


export async function TaskList() {
	const res = await fetch(
		TASK_API,
		{credentials: "include"}
	);
	{(console.log(TASK_API), '')}

	let data = await res.json();
	if (res.ok) {
		return data;
	}
	else {
		throw({status: res.status, detail: data.detail});
	}
};


export async function TaskApply(payload) {
	
	const res = await fetch(
		env.PUBLIC_BACKEND_URL + "project/apply/",
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
	if (res.status == 202) {
		{(console.log(data), '')}
		return data;
	}
	else {
		throw({status: res.status, detail: data.detail});
	}
};
